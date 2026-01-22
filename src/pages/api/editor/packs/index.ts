import type { NextApiRequest, NextApiResponse } from 'next';
import { createPack, listPacks } from '../../../../server/editorPacksStore';

const handler = (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'GET') {
    const { userId } = req.query;
    const resolvedUserId =
      typeof userId === 'string' && userId.trim().length > 0 ? userId : 'demo';
    res.status(200).json({ packs: listPacks(resolvedUserId) });
    return;
  }

  if (req.method === 'POST') {
    const {
      name,
      description,
      regionSummary,
      ownerId,
      visibility,
      submitForReview,
    } = req.body as {
      name?: string;
      description?: string;
      regionSummary?: string;
      ownerId?: string;
      visibility?: 'draft' | 'published' | 'curated';
      submitForReview?: boolean;
    };
    if (!name || !description) {
      res.status(400).json({ error: 'Missing pack name/description' });
      return;
    }
    const result = createPack({
      name,
      description,
      regionSummary,
      ownerId: ownerId || 'demo',
      visibility,
      submitForReview,
    });
    if ('error' in result) {
      res.status(409).json({ error: result.error });
      return;
    }
    res.status(201).json({ pack: result.pack });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};

export default handler;
