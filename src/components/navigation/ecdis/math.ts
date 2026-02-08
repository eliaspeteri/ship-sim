export function latLonToXY(
  latitude: number,
  longitude: number,
  center: { latitude: number; longitude: number },
  scale: number,
) {
  return [
    (longitude - center.longitude) * scale,
    -(latitude - center.latitude) * scale,
  ] as const;
}

export function worldFromShip(
  ox: number,
  oy: number,
  headingDeg: number,
  forward: number,
  starboard: number,
) {
  const rad = (headingDeg * Math.PI) / 180;
  const sin = Math.sin(rad);
  const cos = Math.cos(rad);
  const x = ox + forward * sin + starboard * cos;
  const y = oy + forward * cos - starboard * sin;
  return { x, y };
}

export function formatLatLon(
  value: number | undefined,
  positive: string,
  negative: string,
) {
  if (value === undefined || Number.isNaN(value)) return '--';
  const hemi = value >= 0 ? positive : negative;
  return `${Math.abs(value).toFixed(5)}${hemi}`;
}
