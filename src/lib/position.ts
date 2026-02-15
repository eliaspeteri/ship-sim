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
  const z = update.z ?? current.z;
  if (update.lat !== undefined || update.lon !== undefined) {
    const lat = update.lat ?? current.lat;
    const lon = update.lon ?? current.lon;
    return positionFromLatLon({ lat, lon, z });
  }
  if (update.x !== undefined || update.y !== undefined) {
    const x = update.x ?? current.x ?? 0;
    const y = update.y ?? current.y ?? 0;
    return positionFromXY({ x, y, z });
  }
  return positionFromLatLon({
    lat: current.lat,
    lon: current.lon,
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

export const worldVelocityFromBody = (
  headingRad: number,
  velocity: { surge?: number; sway?: number },
): { x: number; y: number } => {
  const surge = velocity.surge ?? 0;
  const sway = velocity.sway ?? 0;
  const cosH = Math.cos(headingRad);
  const sinH = Math.sin(headingRad);
  return {
    x: surge * cosH - sway * sinH,
    y: surge * sinH + sway * cosH,
  };
};

export const bodyVelocityFromWorld = (
  headingRad: number,
  world: { x: number; y: number },
): { surge: number; sway: number } => {
  const cosH = Math.cos(headingRad);
  const sinH = Math.sin(headingRad);
  return {
    surge: world.x * cosH + world.y * sinH,
    sway: -world.x * sinH + world.y * cosH,
  };
};

export const speedFromWorldVelocity = (world: { x: number; y: number }) =>
  Math.hypot(world.x, world.y);

export const courseFromWorldVelocity = (world: { x: number; y: number }) =>
  ((Math.atan2(world.x, world.y) * 180) / Math.PI + 360) % 360;
