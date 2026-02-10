import Pbf from 'pbf';
import { VectorTile } from '@mapbox/vector-tile';
import earcut from 'earcut';
import * as THREE from 'three';
import { latLonToXY } from '../../lib/geo'; // adjust if your path is different

type TerrainRgbTile = {
  data: Uint8ClampedArray;
  width: number;
  height: number;
};

function tile2lon(x: number, z: number) {
  return (x / Math.pow(2, z)) * 360 - 180;
}

function tile2lat(y: number, z: number) {
  const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, z);
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

function mvtPointToLonLat(
  z: number,
  x: number,
  y: number,
  extent: number,
  px: number,
  py: number,
) {
  // MVT local coords: [0..extent], slippy tile origin is top-left.
  const fx = x + px / extent;
  const fy = y + py / extent;
  return { lon: tile2lon(fx, z), lat: tile2lat(fy, z) };
}

async function fetchTerrainRgbTile(
  z: number,
  x: number,
  y: number,
): Promise<TerrainRgbTile | null> {
  if (typeof createImageBitmap === 'undefined') return null;
  if (typeof document === 'undefined' && typeof OffscreenCanvas === 'undefined')
    return null;

  const r = await fetch(`/api/tiles/terrain/${z}/${x}/${y}.png`);
  if (!r.ok) return null;

  const blob = await r.blob();
  const bitmap = await createImageBitmap(blob);
  const canvas =
    typeof OffscreenCanvas !== 'undefined'
      ? new OffscreenCanvas(bitmap.width, bitmap.height)
      : document.createElement('canvas');

  canvas.width = bitmap.width;
  canvas.height = bitmap.height;

  const ctx = canvas.getContext('2d') as
    | globalThis.OffscreenCanvasRenderingContext2D
    | globalThis.CanvasRenderingContext2D
    | null;
  if (!ctx) {
    bitmap.close?.();
    return null;
  }

  ctx.drawImage(bitmap, 0, 0);
  bitmap.close?.();

  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return { data: img.data, width: img.width, height: img.height };
}

function sampleTerrainHeight(tile: TerrainRgbTile, u: number, v: number) {
  const x = Math.min(
    tile.width - 1,
    Math.max(0, Math.round(u * (tile.width - 1))),
  );
  const y = Math.min(
    tile.height - 1,
    Math.max(0, Math.round(v * (tile.height - 1))),
  );
  const idx = (y * tile.width + x) * 4;
  const r = tile.data[idx];
  const g = tile.data[idx + 1];
  const b = tile.data[idx + 2];

  return (r * 256 * 256 + g * 256 + b) * 0.1 - 10000;
}

export async function fetchLandTileMesh(opts: {
  z: number;
  x: number;
  y: number;
  landY?: number; // meters above water plane to avoid z-fighting
  heightScale?: number;
  seaLevel?: number;
  useTerrain?: boolean;
}) {
  const {
    z,
    x,
    y,
    landY = 0.5,
    heightScale = 1,
    seaLevel = 0,
    useTerrain = true,
  } = opts;

  const r = await fetch(`/api/tiles/land/${z}/${x}/${y}`);
  if (!r.ok) return null;

  const ab = await r.arrayBuffer();
  const tile = new VectorTile(new Pbf(new Uint8Array(ab)));

  const layer = tile.layers['land'];
  if (!layer || layer.length === 0) return null;

  const terrain = useTerrain ? await fetchTerrainRgbTile(z, x, y) : null;

  const positions: number[] = [];
  const indices: number[] = [];
  let vertBase = 0;

  // Minimal triangulation: treats each ring as its own polygon.
  // Natural Earth land is simple enough to start with; we can add hole support later.
  for (let i = 0; i < layer.length; i++) {
    const feat = layer.feature(i);
    const rings = feat.loadGeometry();
    const extent = layer.extent ?? 4096;

    for (const ring of rings) {
      if (ring.length < 3) continue;

      const flat2d: number[] = [];

      for (const p of ring) {
        const u = Math.max(0, Math.min(1, p.x / extent));
        const v = Math.max(0, Math.min(1, p.y / extent));
        const { lon, lat } = mvtPointToLonLat(z, x, y, extent, p.x, p.y);
        const xy = latLonToXY({ lat, lon }); // <-- your existing meters conversion
        const heightRaw = terrain
          ? sampleTerrainHeight(terrain, u, v)
          : seaLevel;
        const heightMeters = Math.max(seaLevel, heightRaw) - seaLevel;
        const yPos = landY + heightMeters * heightScale;

        flat2d.push(xy.x, xy.y);
        positions.push(xy.x, yPos, xy.y); // X=east, Y=up, Z=north
      }

      const tri = earcut(flat2d);
      for (let t = 0; t < tri.length; t += 3) {
        indices.push(
          vertBase + tri[t],
          vertBase + tri[t + 1],
          vertBase + tri[t + 2],
        );
      }

      vertBase += ring.length;
    }
  }

  if (positions.length === 0 || indices.length === 0) return null;

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setIndex(indices);
  g.computeVertexNormals();

  const m = new THREE.MeshStandardMaterial({
    color: 'hotpink',
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(g, m);
  mesh.frustumCulled = true;

  // Useful for debugging
  mesh.name = `land_${z}_${x}_${y}`;

  return mesh;
}
