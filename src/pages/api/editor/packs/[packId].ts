import type { NextApiRequest, NextApiResponse } from 'next';
import {
  getPack,
  transitionPackStatus,
  updatePack,
} from '../../../../server/editorPacksStore';

const handler = (req: NextApiRequest, res: NextApiResponse) => {
  const { packId } = req.query;
  if (!packId || Array.isArray(packId)) {
    res.status(400).json({ error: 'Invalid pack id' });
    return;
  }

  if (req.method === 'GET') {
    const pack = getPack(packId);
    if (!pack) {
      res.status(404).json({ error: 'Pack not found' });
      return;
    }
    res.status(200).json({ pack });
    return;
  }

  if (req.method === 'PATCH') {
    const { status, ...patch } = req.body as {
      status?: 'draft' | 'submitted' | 'published';
    };
    if (status) {
      const updated = transitionPackStatus(packId, status);
      if (!updated) {
        res.status(400).json({ error: 'Invalid status transition' });
        return;
      }
      res.status(200).json({ pack: updated });
      return;
    }
    const updated = updatePack(packId, patch);
    if (!updated) {
      res.status(404).json({ error: 'Pack not found' });
      return;
    }
    res.status(200).json({ pack: updated });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};

export default handler;
