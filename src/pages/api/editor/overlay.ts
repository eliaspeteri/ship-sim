import { getOverlayChunks } from '../../../server/editorCompilationStore';

import type { NextApiRequest, NextApiResponse } from 'next';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { packId, z, x, y, lod, layers } = req.query;
  if (!packId || !z || !x || !y || !lod) {
    res.status(400).json({ error: 'Missing query parameters' });
    return;
  }

  const layerIds = Array.isArray(layers)
    ? layers
    : typeof layers === 'string'
      ? layers
          .split(',')
          .map(item => item.trim())
          .filter(Boolean)
      : [];

  const chunks = await getOverlayChunks({
    packId: String(packId),
    tile: {
      z: Number(z),
      x: Number(x),
      y: Number(y),
    },
    layerIds,
    lod: Number(lod),
  });

  res.status(200).json({
    chunks: chunks.map(chunk => ({
      layerId: chunk.layerId,
      lod: chunk.lod,
      bytesBase64: chunk.bytesBase64,
    })),
  });
};

export default handler;
