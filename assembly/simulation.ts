import {
  DEFAULT_BLOCK_COEFFICIENT,
  DEFAULT_DRAG_COEFFICIENT,
  DEFAULT_HEAVE_DAMPING,
  DEFAULT_HEAVE_STIFFNESS,
  DEFAULT_MAX_SPEED,
  DEFAULT_MAX_THRUST,
  DEFAULT_PITCH_DAMPING,
  DEFAULT_ROLL_DAMPING,
  DEFAULT_RUDDER_FORCE_COEFFICIENT,
  DEFAULT_RUDDER_MAX_ANGLE,
  DEFAULT_RUDDER_STALL_ANGLE,
  DEFAULT_SWAY_DAMPING,
  DEFAULT_YAW_DAMPING,
  DEFAULT_YAW_DAMPING_QUAD,
  GRAVITY,
  MAX_SPEED_MULTIPLIER,
  MAX_WAVE_HEIGHT,
  MAX_YAW_MULTIPLIER,
  MAX_YAW_RATE,
  SHALLOW_WATER_MAX_RATIO,
  SHALLOW_WATER_MIN_RATIO,
  WATER_DENSITY,
  WAVE_HEIGHT_PER_WIND,
  VesselState,
  clamp01,
  clampSigned,
  ensureVessel,
  getGlobalEnvironment,
  getGlobalVessel,
  normalizeAngle,
  setGlobalVessel,
} from './runtimeCore';

export function createVessel(
  x: f64,
  y: f64,
  z: f64,
  psi: f64,
  phi: f64,
  theta: f64,
  u: f64,
  v: f64,
  w: f64,
  r: f64,
  p: f64,
  q: f64,
  throttle: f64,
  rudderAngle: f64,
  mass: f64,
  length: f64,
  beam: f64,
  draft: f64,
  blockCoefficient: f64 = DEFAULT_BLOCK_COEFFICIENT,
  rudderForceCoefficient: f64 = DEFAULT_RUDDER_FORCE_COEFFICIENT,
  rudderStallAngle: f64 = DEFAULT_RUDDER_STALL_ANGLE,
  rudderMaxAngle: f64 = DEFAULT_RUDDER_MAX_ANGLE,
  dragCoefficient: f64 = DEFAULT_DRAG_COEFFICIENT,
  yawDamping: f64 = DEFAULT_YAW_DAMPING,
  yawDampingQuad: f64 = DEFAULT_YAW_DAMPING_QUAD,
  swayDamping: f64 = DEFAULT_SWAY_DAMPING,
  maxThrust: f64 = DEFAULT_MAX_THRUST,
  maxSpeed: f64 = DEFAULT_MAX_SPEED,
  rollDamping: f64 = DEFAULT_ROLL_DAMPING,
  pitchDamping: f64 = DEFAULT_PITCH_DAMPING,
  heaveStiffness: f64 = DEFAULT_HEAVE_STIFFNESS,
  heaveDamping: f64 = DEFAULT_HEAVE_DAMPING,
): usize {
  if (getGlobalVessel() === null) {
    setGlobalVessel(
      new VesselState(
        x,
        y,
        z,
        psi,
        phi,
        theta,
        u,
        v,
        w,
        r,
        p,
        q,
        clamp01(throttle),
        rudderAngle,
        mass,
        length,
        beam,
        draft,
        blockCoefficient,
        rudderForceCoefficient,
        rudderStallAngle,
        rudderMaxAngle,
        dragCoefficient,
        yawDamping,
        yawDampingQuad,
        swayDamping,
        maxThrust,
        maxSpeed,
        rollDamping,
        pitchDamping,
        heaveStiffness,
        heaveDamping,
      ),
    );
  }

  return changetype<usize>(getGlobalVessel());
}

export function destroyVessel(_vesselPtr: usize): void {
  setGlobalVessel(null);
}

export function updateVesselState(
  vesselPtr: usize,
  dt: f64,
  windSpeed: f64,
  windDirection: f64,
  currentSpeed: f64,
  currentDirection: f64,
  waveHeight: f64,
  waveLength: f64,
  waveDirection: f64,
  waveSteepness: f64,
): usize {
  const vessel = ensureVessel(vesselPtr);
  const safeDt = dt < 0.0 ? 0.0 : dt > 0.25 ? 0.25 : dt;

  const ballastFactor = clamp01(vessel.ballast);
  const effectiveMass = vessel.mass * (0.9 + ballastFactor * 0.4);

  const throttleCommand = clampSigned(vessel.throttleCommand, 1.0);
  const engineTau =
    vessel.engineTimeConstant > 0.05 ? vessel.engineTimeConstant : 0.05;
  vessel.throttle += ((throttleCommand - vessel.throttle) / engineTau) * safeDt;
  vessel.throttle = clampSigned(vessel.throttle, 1.0);

  const rudderDelta = vessel.rudderCommand - vessel.rudderAngle;
  const maxRudderStep =
    vessel.rudderRateLimit > 0.0
      ? vessel.rudderRateLimit * safeDt
      : Math.abs(rudderDelta);
  if (Math.abs(rudderDelta) <= maxRudderStep) {
    vessel.rudderAngle = vessel.rudderCommand;
  } else {
    vessel.rudderAngle += rudderDelta > 0.0 ? maxRudderStep : -maxRudderStep;
  }

  const hasFuel = vessel.fuelLevel > 0.0;
  const throttle = hasFuel ? vessel.throttle : 0.0;
  const thrust = vessel.maxThrust * throttle;
  const fuelBurn = Math.abs(throttle) * vessel.fuelConsumptionRate * safeDt;
  vessel.fuelLevel = clamp01(vessel.fuelLevel - fuelBurn);
  vessel.lastFuelConsumption =
    safeDt > 0.0 ? (fuelBurn / safeDt) * 3600.0 : 0.0;

  const relCurrentDir = currentDirection - vessel.psi;
  const currentSurge = currentSpeed * Math.cos(relCurrentDir);
  const currentSway = currentSpeed * Math.sin(relCurrentDir);
  const uRel = vessel.u - currentSurge;
  const vRel = vessel.v - currentSway;

  const waterDepth = getGlobalEnvironment().waterDepth;
  const depthRatio =
    waterDepth > 0.0
      ? waterDepth / (vessel.draft + 0.01)
      : SHALLOW_WATER_MAX_RATIO + 1.0;
  let shallowT = 0.0;
  if (depthRatio > 0.0 && depthRatio < SHALLOW_WATER_MAX_RATIO) {
    const clampedRatio =
      depthRatio < SHALLOW_WATER_MIN_RATIO
        ? SHALLOW_WATER_MIN_RATIO
        : depthRatio;
    shallowT =
      (SHALLOW_WATER_MAX_RATIO - clampedRatio) /
      (SHALLOW_WATER_MAX_RATIO - SHALLOW_WATER_MIN_RATIO);
  }

  const shallowFactor = 1.0 + vessel.shallowWaterFactor * shallowT;
  const shallowYawFactor = 1.0 + vessel.shallowWaterYawFactor * shallowT;
  const shallowRudderFactor =
    1.0 - (1.0 - vessel.shallowWaterRudderFactor) * shallowT;

  const hullFactor = 0.7 + vessel.blockCoefficient * 0.6;
  const areaX = Math.max(1.0, vessel.length * vessel.draft * hullFactor);
  const areaY = Math.max(
    1.0,
    vessel.beam * vessel.draft * (0.7 + vessel.blockCoefficient * 0.3),
  );
  const dragSurge =
    0.5 *
    WATER_DENSITY *
    vessel.cdSurge *
    areaX *
    uRel *
    Math.abs(uRel) *
    shallowFactor;
  const dragSway =
    0.5 *
    WATER_DENSITY *
    vessel.cdSway *
    areaY *
    vRel *
    Math.abs(vRel) *
    shallowFactor;
  const swayLinear = vessel.swayDamping * vRel;

  const flowSpeed = Math.sqrt(uRel * uRel + vRel * vRel);
  const washSpeed =
    vessel.propWashFactor > 0.0
      ? Math.sqrt(
          Math.abs(thrust) / (0.5 * WATER_DENSITY * vessel.rudderArea + 1e-6),
        ) * vessel.propWashFactor
      : 0.0;
  const inflowSpeed = Math.sqrt(flowSpeed * flowSpeed + washSpeed * washSpeed);
  const inflowAngle = Math.atan2(vRel, Math.max(0.1, uRel));
  const alpha = vessel.rudderAngle - inflowAngle;
  const absAlpha = Math.abs(alpha);
  const stallRatio =
    vessel.rudderStallAngle > 0.0 ? absAlpha / vessel.rudderStallAngle : 1.0;
  const stallFactor = stallRatio >= 1.0 ? 0.0 : 1.0 - stallRatio * stallRatio;
  const liftCoeff = vessel.rudderLiftSlope * alpha * Math.max(0.0, stallFactor);
  const rudderForce =
    0.5 *
    WATER_DENSITY *
    vessel.rudderArea *
    inflowSpeed *
    inflowSpeed *
    liftCoeff;
  const rudderSway = rudderForce * shallowRudderFactor;
  const rudderMoment = rudderSway * vessel.rudderArm;

  const hullSway = -(vessel.hullYv * vRel + vessel.hullYr * vessel.r);
  const hullYaw = -(vessel.hullNv * vRel + vessel.hullNr * vessel.r);

  const windYaw =
    windSpeed * windSpeed * 0.01 * Math.sin(windDirection - vessel.psi);

  const mass = effectiveMass;
  const massX = Math.max(1.0, mass + vessel.addedMassX);
  const massY = Math.max(1.0, mass + vessel.addedMassY);
  const Izz = Math.max(
    1.0,
    mass * vessel.length * vessel.length * 0.1 + vessel.addedMassYaw,
  );
  const Ixx = mass * vessel.beam * vessel.beam * 0.08;
  const Iyy = mass * vessel.length * vessel.length * 0.08;

  const X = thrust - dragSurge;
  const Y = -dragSway - swayLinear + rudderSway + hullSway;
  const N =
    rudderMoment +
    hullYaw -
    windYaw -
    vessel.yawDamping * vessel.r * shallowYawFactor -
    vessel.yawDampingQuad * vessel.r * Math.abs(vessel.r) * shallowYawFactor;

  const uDot = X / massX + vessel.v * vessel.r;
  const vDot = Y / massY - vessel.u * vessel.r;
  const rDot = N / Izz;

  const fallbackWaveHeight = Math.min(
    MAX_WAVE_HEIGHT,
    windSpeed * WAVE_HEIGHT_PER_WIND,
  );
  const waveH = waveHeight > 0.0 ? waveHeight : fallbackWaveHeight;
  const waveAmp = waveH * 0.5;
  const waveLen =
    waveLength > 1.0 ? waveLength : Math.max(20.0, vessel.length * 2.0);
  const waveDir =
    waveDirection == waveDirection ? waveDirection : windDirection;
  const k = (2.0 * Math.PI) / waveLen;
  const omega = Math.sqrt(GRAVITY * k);
  const steep =
    waveSteepness > 0.0 ? waveSteepness : Math.min(0.7, waveAmp * k);

  vessel.waveAmplitude = waveAmp;
  vessel.waveLength = waveLen;
  vessel.waveDirection = waveDir;
  vessel.waveSteepness = steep;
  vessel.waveTime += safeDt;

  const dirX = Math.cos(waveDir);
  const dirY = Math.sin(waveDir);
  const phase =
    k * (dirX * vessel.x + dirY * vessel.y) - omega * vessel.waveTime;
  const sinPhase = Math.sin(phase);
  const cosPhase = Math.cos(phase);
  const waveElevation = waveAmp * sinPhase;
  const slope = steep * cosPhase;
  const waveSlopeX = slope * dirX;
  const waveSlopeY = slope * dirY;

  const neutralDraft =
    effectiveMass /
    (WATER_DENSITY * vessel.length * vessel.beam * vessel.blockCoefficient +
      1e-6);
  const targetDraft = neutralDraft * (0.7 + ballastFactor * 0.5);
  const targetZ = -(targetDraft + waveElevation);
  const heaveAccel =
    (targetZ - vessel.z) * vessel.heaveStiffness -
    vessel.heaveDamping * vessel.w;
  vessel.w += heaveAccel * safeDt;
  vessel.z += vessel.w * safeDt;

  const waveSlopeRoll = waveSlopeY;
  const waveSlopePitch = waveSlopeX;
  const gmRoll =
    (vessel.beam * vessel.beam * vessel.blockCoefficient) /
    (12.0 * (vessel.draft + 0.1));
  const gmPitch =
    (vessel.length * vessel.blockCoefficient) / (12.0 * (vessel.draft + 0.1));

  const rollRestoring =
    -GRAVITY * gmRoll * mass * (vessel.rollAngle - waveSlopeRoll);
  const pitchRestoring =
    -GRAVITY * gmPitch * mass * (vessel.pitchAngle - waveSlopePitch);

  const pDot = rollRestoring / Ixx - vessel.rollDamping * vessel.p;
  const qDot = pitchRestoring / Iyy - vessel.pitchDamping * vessel.q;
  vessel.p += pDot * safeDt;
  vessel.q += qDot * safeDt;

  vessel.rollAngle += vessel.p * safeDt;
  vessel.pitchAngle += vessel.q * safeDt;

  vessel.u += uDot * safeDt;
  vessel.v += vDot * safeDt;
  vessel.r += rDot * safeDt;

  const speedCap = vessel.maxSpeed * MAX_SPEED_MULTIPLIER;
  vessel.u = clampSigned(vessel.u, speedCap);
  vessel.v = clampSigned(vessel.v, speedCap * 0.6);
  vessel.r = clampSigned(vessel.r, MAX_YAW_RATE * MAX_YAW_MULTIPLIER);

  vessel.psi = normalizeAngle(vessel.psi + vessel.r * safeDt);

  const cosPsi = Math.cos(vessel.psi);
  const sinPsi = Math.sin(vessel.psi);
  const worldU = vessel.u * cosPsi - vessel.v * sinPsi;
  const worldV = vessel.u * sinPsi + vessel.v * cosPsi;
  vessel.x += worldU * safeDt;
  vessel.y += worldV * safeDt;

  return vesselPtr;
}

export function setThrottle(vesselPtr: usize, throttle: f64): void {
  const vessel = ensureVessel(vesselPtr);
  vessel.throttleCommand = clampSigned(throttle, 1.0);
}

export function setRudderAngle(vesselPtr: usize, angle: f64): void {
  const vessel = ensureVessel(vesselPtr);
  if (!isFinite(angle)) return;

  let clamped = angle;
  if (clamped > vessel.rudderMaxAngle) clamped = vessel.rudderMaxAngle;
  if (clamped < -vessel.rudderMaxAngle) clamped = -vessel.rudderMaxAngle;
  vessel.rudderCommand = clamped;
}

export function setBallast(vesselPtr: usize, level: f64): void {
  const vessel = ensureVessel(vesselPtr);
  vessel.ballast = clamp01(level);
}
