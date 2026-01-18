import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { z, x, y } = req.query;

  if (!z || !x || !y) {
    res.status(400).send('Missing z/x/y');
    return;
  }

  const base = process.env.TILES_BASE_URL ?? 'http://localhost:7800';
  const url = `${base}/public.land_mvt/${z}/${x}/${y}.pbf`;

  const r = await fetch(url);
  if (!r.ok) {
    res.status(r.status).send(await r.text());
    return;
  }

  const buf = Buffer.from(await r.arrayBuffer());
  res.setHeader('Content-Type', 'application/x-protobuf');
  res.setHeader(
    'Cache-Control',
    'public, max-age=3600, stale-while-revalidate=86400',
  );
  res.status(200).send(buf);
}
