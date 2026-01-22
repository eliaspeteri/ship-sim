import type { NextApiRequest, NextApiResponse } from 'next';
import {
  deletePack,
  getPack,
  getPackBySlug,
  hasDuplicateName,
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
    const { ownerId } = req.query;
    const resolvedOwnerId =
      typeof ownerId === 'string' && ownerId.trim().length > 0 ? ownerId : null;
    const pack = resolvedOwnerId
      ? getPackBySlug(resolvedOwnerId, packId)
      : getPack(packId);
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
      name?: string;
      description?: string;
      regionSummary?: string;
      submitForReview?: boolean;
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
    const existing = getPack(packId);
    if (!existing) {
      res.status(404).json({ error: 'Pack not found' });
      return;
    }
    if (
      typeof patch.name === 'string' &&
      patch.name.trim().length > 0 &&
      hasDuplicateName(existing.ownerId, patch.name, existing.id)
    ) {
      res.status(409).json({ error: 'Duplicate pack title' });
      return;
    }
    if (existing.status === 'published' && patch.submitForReview === false) {
      res.status(400).json({ error: 'Published packs cannot be revoked' });
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

  if (req.method === 'DELETE') {
    const ok = deletePack(packId);
    if (!ok) {
      res.status(404).json({ error: 'Pack not found' });
      return;
    }
    res.status(204).end();
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};

export default handler;
