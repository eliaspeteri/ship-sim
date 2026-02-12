import type { NextApiRequest, NextApiResponse } from 'next';
import { storeArtifacts } from '../../../server/editorCompilationStore';
import { getPack } from '../../../server/editorPacksStore';
import { createRateLimiter } from '../../../server/rateLimit';
import { COMPILE_LIMITS } from '../../../server/requestLimits';
import { canManagePack, requireEditorActor } from './auth';

type CompileRequest = {
  packId: string;
  layerIds: string[];
  tiles: Array<{ z: number; x: number; y: number }>;
};

type TileInput = { z: number; x: number; y: number };

const compileLimiter = createRateLimiter(COMPILE_LIMITS.rateLimit);

const getPayloadBytes = (payload: unknown) =>
  Buffer.byteLength(JSON.stringify(payload ?? {}), 'utf8');

const normalizeLayerIds = (input: unknown) =>
  Array.isArray(input)
    ? input
        .filter((value): value is string => typeof value === 'string')
        .map(value => value.trim())
        .filter(Boolean)
    : [];

const isTile = (value: unknown): value is TileInput => {
  if (!value || typeof value !== 'object') return false;
  const tile = value as { z?: unknown; x?: unknown; y?: unknown };
  return (
    Number.isFinite(tile.z) &&
    Number.isFinite(tile.x) &&
    Number.isFinite(tile.y)
  );
};

const parseTiles = (input: unknown) => {
  if (!Array.isArray(input)) {
    return { tiles: [] as TileInput[], invalid: true };
  }
  const tiles = input.filter(isTile).map(tile => ({
    z: Number(tile.z),
    x: Number(tile.x),
    y: Number(tile.y),
  }));
  return { tiles, invalid: tiles.length !== input.length };
};

const isPayloadTooLarge = (layerCount: number, tileCount: number) => {
  if (layerCount > COMPILE_LIMITS.maxLayers) return true;
  if (tileCount > COMPILE_LIMITS.maxTiles) return true;
  return layerCount * tileCount > COMPILE_LIMITS.maxArtifacts;
};

const setRetryAfterHeader = (res: NextApiResponse, retryAfterMs: number) => {
  const seconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
  res.setHeader('Retry-After', String(seconds));
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const payloadBytes = getPayloadBytes(req.body);
  if (payloadBytes > COMPILE_LIMITS.maxPayloadBytes) {
    res.status(413).json({ error: 'Compile request too large' });
    return;
  }

  const actor = await requireEditorActor(req, res);
  if (!actor) return;

  const body = req.body as CompileRequest;
  const layerIds = normalizeLayerIds(body?.layerIds);
  const { tiles, invalid } = parseTiles(body?.tiles);
  if (!body?.packId || layerIds.length === 0 || invalid) {
    res.status(400).json({ error: 'Invalid payload' });
    return;
  }

  if (isPayloadTooLarge(layerIds.length, tiles.length)) {
    res.status(413).json({ error: 'Compile request too large' });
    return;
  }

  const rateLimit = compileLimiter.check(actor.userId);
  if (!rateLimit.allowed) {
    setRetryAfterHeader(res, rateLimit.retryAfterMs);
    res.status(429).json({ error: 'Too many compile requests' });
    return;
  }

  const pack = getPack(body.packId);
  if (!pack) {
    res.status(404).json({ error: 'Pack not found' });
    return;
  }
  if (!canManagePack(actor, pack.ownerId)) {
    res.status(403).json({ error: 'Not authorized to compile this pack' });
    return;
  }

  const artifacts = tiles.flatMap(tile =>
    layerIds.map(layerId => ({
      tile,
      layerId,
      lod: tile.z,
      bytesBase64: Buffer.from(
        `${body.packId}:${layerId}:${tile.z}/${tile.x}/${tile.y}`,
        'utf8',
      ).toString('base64'),
    })),
  );

  const storedAt = storeArtifacts(body.packId, artifacts);

  res.status(200).json({
    artifactCount: artifacts.length,
    storedAt,
  });
};

export default handler;
