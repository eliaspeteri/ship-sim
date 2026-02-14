export function latLonToXY(
  ...args: [
    latitude: number,
    longitude: number,
    center: { latitude: number; longitude: number },
    scale: number,
  ]
) {
  const [latitude, longitude, center, scale] = args;
  return [
    (longitude - center.longitude) * scale,
    -(latitude - center.latitude) * scale,
  ] as const;
}

export function worldFromShip(
  ...args: [
    ox: number,
    oy: number,
    headingDeg: number,
    forward: number,
    starboard: number,
  ]
) {
  const [ox, oy, headingDeg, forward, starboard] = args;
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
