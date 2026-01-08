import { latLonToXY, xyToLatLon } from './geo';

export type GeoPosition = {
  lat: number;
  lon: number;
  z: number;
  x?: number;
  y?: number;
};

export const positionFromLatLon = ({
  lat,
  lon,
  z = 0,
}: {
  lat: number;
  lon: number;
  z?: number;
}): GeoPosition => {
  const { x, y } = latLonToXY({ lat, lon });
  return { lat, lon, z, x, y };
};

export const positionFromXY = ({
  x,
  y,
  z = 0,
}: {
  x: number;
  y: number;
  z?: number;
}): GeoPosition => {
  const { lat, lon } = xyToLatLon({ x, y });
  return { lat, lon, z, x, y };
};

export const mergePosition = (
  current: GeoPosition,
  update?: Partial<GeoPosition>,
): GeoPosition => {
  if (!update) {
    return positionFromLatLon({
      lat: current.lat,
      lon: current.lon,
      z: current.z,
    });
  }
  const z = update.z ?? current.z ?? 0;
  if (update.lat !== undefined || update.lon !== undefined) {
    const lat = update.lat ?? current.lat ?? 0;
    const lon = update.lon ?? current.lon ?? 0;
    return positionFromLatLon({ lat, lon, z });
  }
  if (update.x !== undefined || update.y !== undefined) {
    const x = update.x ?? current.x ?? 0;
    const y = update.y ?? current.y ?? 0;
    return positionFromXY({ x, y, z });
  }
  return positionFromLatLon({
    lat: current.lat ?? 0,
    lon: current.lon ?? 0,
    z,
  });
};

export const ensurePosition = (pos?: Partial<GeoPosition>): GeoPosition => {
  if (!pos) {
    return positionFromLatLon({ lat: 0, lon: 0, z: 0 });
  }
  if (pos.lat !== undefined || pos.lon !== undefined) {
    return positionFromLatLon({
      lat: pos.lat ?? 0,
      lon: pos.lon ?? 0,
      z: pos.z ?? 0,
    });
  }
  if (pos.x !== undefined || pos.y !== undefined) {
    return positionFromXY({
      x: pos.x ?? 0,
      y: pos.y ?? 0,
      z: pos.z ?? 0,
    });
  }
  return positionFromLatLon({ lat: 0, lon: 0, z: pos.z ?? 0 });
};

export const positionToXY = (pos: {
  lat: number;
  lon: number;
}): { x: number; y: number } => latLonToXY(pos);

export const positionToLatLon = (pos: {
  x: number;
  y: number;
}): { lat: number; lon: number } => xyToLatLon(pos);

export const distanceMeters = (
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
): number => {
  const { x: ax, y: ay } = latLonToXY(a);
  const { x: bx, y: by } = latLonToXY(b);
  return Math.hypot(ax - bx, ay - by);
};
