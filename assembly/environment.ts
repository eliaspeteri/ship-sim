import {
  ENV_CURRENT_DIRECTION,
  ENV_CURRENT_SPEED,
  ENV_WATER_DEPTH,
  ENV_WAVE_DIRECTION,
  ENV_WAVE_HEIGHT,
  ENV_WAVE_LENGTH,
  ENV_WAVE_STEEPNESS,
  ENV_WIND_DIRECTION,
  ENV_WIND_SPEED,
  getEnvironmentBufferCapacity as getEnvironmentBufferCapacityImpl,
  getEnvironmentBufferPtr as getEnvironmentBufferPtrImpl,
  getGlobalEnvironment,
  readParam,
} from './runtimeCore';

export function getEnvironmentBufferPtr(): usize {
  return getEnvironmentBufferPtrImpl();
}

export function getEnvironmentBufferCapacity(): i32 {
  return getEnvironmentBufferCapacityImpl();
}

export function setEnvironment(paramsPtr: usize, paramsLen: i32): void {
  if (paramsPtr === 0 || paramsLen <= 0) return;

  const params = changetype<StaticArray<f64>>(paramsPtr);
  const len = paramsLen > 0 ? paramsLen : 0;
  const environment = getGlobalEnvironment();

  environment.windSpeed = readParam(
    params,
    len,
    ENV_WIND_SPEED,
    environment.windSpeed,
  );
  environment.windDirection = readParam(
    params,
    len,
    ENV_WIND_DIRECTION,
    environment.windDirection,
  );
  environment.currentSpeed = readParam(
    params,
    len,
    ENV_CURRENT_SPEED,
    environment.currentSpeed,
  );
  environment.currentDirection = readParam(
    params,
    len,
    ENV_CURRENT_DIRECTION,
    environment.currentDirection,
  );
  environment.waveHeight = readParam(
    params,
    len,
    ENV_WAVE_HEIGHT,
    environment.waveHeight,
  );
  environment.waveLength = readParam(
    params,
    len,
    ENV_WAVE_LENGTH,
    environment.waveLength,
  );
  environment.waveDirection = readParam(
    params,
    len,
    ENV_WAVE_DIRECTION,
    environment.waveDirection,
  );
  environment.waveSteepness = readParam(
    params,
    len,
    ENV_WAVE_STEEPNESS,
    environment.waveSteepness,
  );
  environment.waterDepth = readParam(
    params,
    len,
    ENV_WATER_DEPTH,
    environment.waterDepth,
  );
}

export function calculateSeaState(windSpeed: f64): f64 {
  const beaufort = windSpeed / 1.5;
  if (beaufort < 0.0) return 0.0;
  if (beaufort > 12.0) return 12.0;
  return beaufort;
}

export function getWaveHeightForSeaState(seaState: f64): f64 {
  return seaState * 0.5;
}
