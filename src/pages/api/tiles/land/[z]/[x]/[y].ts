import type { NextApiRequest, NextApiResponse } from 'next';

const REQUEST_TIMEOUT_MS = 5_000;
const LAND_CONTENT_TYPE = 'application/x-protobuf';
const TILE_CACHE_CONTROL = 'public, max-age=3600, stale-while-revalidate=86400';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { z, x, y } = req.query;

  if (!z || !x || !y) {
    res.status(400).send('Missing z/x/y');
    return;
  }

  const base = process.env.TILES_BASE_URL;
  if (!base) {
    res.status(500).send('Tile proxy is not configured');
    return;
  }
  const url = `${base}/public.land_mvt/${z}/${x}/${y}.pbf`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const r = await fetch(url, { signal: controller.signal });
    if (!r.ok) {
      res.status(502).send('Land tile upstream error');
      return;
    }

    const buf = Buffer.from(await r.arrayBuffer());
    res.setHeader('Content-Type', LAND_CONTENT_TYPE);
    res.setHeader('Cache-Control', TILE_CACHE_CONTROL);
    res.status(200).send(buf);
  } catch (error) {
    if ((error as { name?: string }).name === 'AbortError') {
      res.status(504).send('Land tile upstream timeout');
      return;
    }
    res.status(502).send('Land tile upstream unavailable');
  } finally {
    clearTimeout(timeoutId);
  }
}
