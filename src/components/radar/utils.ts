import { RadarBand, RadarEnvironment, RadarTarget } from './types';

// Convert polar coordinates (distance, bearing) to Cartesian (x, y)
export const polarToCartesian = (
  distance: number,
  bearing: number,
  maxRange: number,
  radius: number,
): { x: number; y: number } => {
  // Convert bearing to radians (0° = up, clockwise)
  const bearingRad = ((360 - bearing + 270) % 360) * (Math.PI / 180);

  // Scale distance according to maximum range
  const scaledDistance = (distance / maxRange) * radius;

  const x = radius + scaledDistance * Math.cos(bearingRad);
  const y = radius + scaledDistance * Math.sin(bearingRad);

  return { x, y };
};

// Calculate target visibility based on radar settings and environment
export const calculateTargetVisibility = (
  target: RadarTarget,
  band: RadarBand,
  gain: number,
  seaClutter: number,
  rainClutter: number,
  environment: RadarEnvironment,
): number => {
  // Base visibility based on target size
  let visibility = target.size;

  // Apply gain effect (higher gain makes targets more visible)
  visibility *= 0.3 + (gain / 100) * 0.7;

  // Apply distance attenuation
  visibility *= Math.max(0.2, 1 - target.distance * 0.05);

  // Apply environmental factors based on radar band
  if (band === 'X') {
    // X-band is more affected by rain
    visibility *= Math.max(
      0.2,
      1 - (environment.rainIntensity / 10) * (1 - rainClutter / 100),
    );

    // Sea state affects both bands but can be suppressed
    visibility *= Math.max(
      0.3,
      1 - (environment.seaState / 10) * (1 - seaClutter / 100),
    );
  } else {
    // S-band is less affected by rain but still affected
    visibility *= Math.max(
      0.6,
      1 - (environment.rainIntensity / 10) * 0.4 * (1 - rainClutter / 100),
    );

    // Sea state affects both bands but can be suppressed
    visibility *= Math.max(
      0.5,
      1 - (environment.seaState / 10) * 0.5 * (1 - seaClutter / 100),
    );
  }

  // Target type specific adjustments
  if (target.type === 'land') {
    // Land masses have stronger returns
    visibility *= 1.5;
  } else if (target.type === 'buoy') {
    // Buoys are smaller and harder to detect
    visibility *= 0.7;
  }

  // Clamp visibility between 0 and 1
  return Math.max(0, Math.min(1, visibility));
};

// Generate noise for the radar display
export const generateRadarNoise = (
  band: RadarBand,
  environment: RadarEnvironment,
  gain: number,
): number => {
  // Base noise level
  let noise = 0.05;

  // Higher gain amplifies noise
  noise *= 1 + (gain / 100) * 0.5;

  // Environmental factors
  if (band === 'X') {
    // X-band is more affected by weather
    noise += (environment.rainIntensity / 10) * 0.15;
    noise += (environment.seaState / 10) * 0.1;
  } else {
    // S-band is less affected
    noise += (environment.rainIntensity / 10) * 0.05;
    noise += (environment.seaState / 10) * 0.05;
  }

  return noise;
};

// Get sea clutter pattern strength based on distance from center
export const getSeaClutterStrength = (
  distanceFromCenter: number,
  maxRange: number,
  seaState: number,
  seaClutterSetting: number,
): number => {
  // Sea clutter is stronger closer to the vessel
  const normalizedDistance = distanceFromCenter / maxRange;

  // Sea clutter decreases with distance exponentially
  let clutterStrength = Math.max(0, 1 - Math.pow(normalizedDistance * 2, 2));

  // Scale based on sea state
  clutterStrength *= seaState / 10;

  // Reduce based on sea clutter suppression setting
  clutterStrength *= 1 - seaClutterSetting / 100;

  return Math.max(0, Math.min(0.8, clutterStrength));
};

// Get rain clutter pattern strength
export const getRainClutterStrength = (
  band: RadarBand,
  rainIntensity: number,
  rainClutterSetting: number,
): number => {
  let strength = rainIntensity / 10;

  // X-band is more affected by rain
  if (band === 'X') {
    strength *= 1.5;
  }

  // Reduce based on rain clutter suppression setting
  strength *= 1 - rainClutterSetting / 100;

  return Math.max(0, Math.min(0.9, strength));
};

// Generate a random radar noise pattern
export const generateNoisePattern = (
  width: number,
  height: number,
  noiseLevel: number,
): ImageData => {
  const data = new ImageData(width, height);

  for (let i = 0; i < data.data.length; i += 4) {
    const randomValue = Math.random() < noiseLevel ? 255 * Math.random() : 0;
    data.data[i] = randomValue; // R
    data.data[i + 1] = randomValue; // G
    data.data[i + 2] = randomValue; // B
    data.data[i + 3] = randomValue > 0 ? 255 : 0; // A
  }

  return data;
};
