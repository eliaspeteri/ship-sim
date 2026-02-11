import type { NextApiRequest, NextApiResponse } from 'next';
import { storeArtifacts } from '../../../server/editorCompilationStore';
import { getPack } from '../../../server/editorPacksStore';
import { canManagePack, requireEditorActor } from './auth';

type CompileRequest = {
  packId: string;
  layerIds: string[];
  tiles: Array<{ z: number; x: number; y: number }>;
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const actor = await requireEditorActor(req, res);
  if (!actor) return;

  const body = req.body as CompileRequest;
  if (!body?.packId || !Array.isArray(body.layerIds)) {
    res.status(400).json({ error: 'Invalid payload' });
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

  const artifacts = body.tiles.flatMap(tile =>
    body.layerIds.map(layerId => ({
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
