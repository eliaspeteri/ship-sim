import { BBOX_KEY_PRECISION, HAVERSINE_EARTH_RADIUS_M } from './constants';

type LatLon = { lat: number; lon: number };

type Bbox = {
  south: number;
  west: number;
  north: number;
  east: number;
};

export const haversineMeters = (a: LatLon, b: LatLon) => {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLon / 2);
  const h = s1 * s1 + Math.cos(lat1) * Math.cos(lat2) * s2 * s2;
  return 2 * HAVERSINE_EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
};

export const bboxKey = (bbox: Bbox) => {
  const q = (n: number) => n.toFixed(BBOX_KEY_PRECISION);
  return `${q(bbox.south)}:${q(bbox.west)}:${q(bbox.north)}:${q(bbox.east)}`;
};
