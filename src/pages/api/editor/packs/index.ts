import type { NextApiRequest, NextApiResponse } from 'next';
import { createPack, listPacks } from '../../../../server/editorPacksStore';

const handler = (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'GET') {
    res.status(200).json({ packs: listPacks() });
    return;
  }

  if (req.method === 'POST') {
    const { name, description, regionSummary } = req.body as {
      name?: string;
      description?: string;
      regionSummary?: string;
    };
    if (!name || !description) {
      res.status(400).json({ error: 'Missing pack name/description' });
      return;
    }
    const pack = createPack({
      name,
      description,
      regionSummary,
      ownerId: 'demo',
    });
    res.status(201).json({ pack });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};

export default handler;
