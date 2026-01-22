import type { NextApiRequest, NextApiResponse } from 'next';
import { storeArtifacts } from '../../../server/editorCompilationStore';

type CompileRequest = {
  packId: string;
  layerIds: string[];
  tiles: Array<{ z: number; x: number; y: number }>;
};

const handler = (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = req.body as CompileRequest;
  if (!body?.packId || !Array.isArray(body.layerIds)) {
    res.status(400).json({ error: 'Invalid payload' });
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
