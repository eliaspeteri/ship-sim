import {
  MODEL_DISPLACEMENT,
  PARAM_ADDED_MASS_X,
  PARAM_ADDED_MASS_Y,
  PARAM_ADDED_MASS_YAW,
  PARAM_BEAM,
  PARAM_BLOCK_COEFFICIENT,
  PARAM_CD_SURGE,
  PARAM_CD_SWAY,
  PARAM_CD_YAW,
  PARAM_DRAG_COEFFICIENT,
  PARAM_DRAFT,
  PARAM_ENGINE_TIME_CONSTANT,
  PARAM_HEAVE_DAMPING,
  PARAM_HEAVE_STIFFNESS,
  PARAM_HULL_NR,
  PARAM_HULL_NV,
  PARAM_HULL_YR,
  PARAM_HULL_YV,
  PARAM_LENGTH,
  PARAM_MASS,
  PARAM_MAX_SPEED,
  PARAM_MAX_THRUST,
  PARAM_PITCH_DAMPING,
  PARAM_PROP_WASH,
  PARAM_ROLL_DAMPING,
  PARAM_RUDDER_AREA,
  PARAM_RUDDER_ARM,
  PARAM_RUDDER_FORCE_COEFFICIENT,
  PARAM_RUDDER_LIFT_SLOPE,
  PARAM_RUDDER_MAX_ANGLE,
  PARAM_RUDDER_RATE,
  PARAM_RUDDER_STALL_ANGLE,
  PARAM_SHALLOW_WATER_FACTOR,
  PARAM_SHALLOW_WATER_RUDDER_FACTOR,
  PARAM_SHALLOW_WATER_YAW_FACTOR,
  PARAM_SWAY_DAMPING,
  PARAM_YAW_DAMPING,
  PARAM_YAW_DAMPING_QUAD,
  clampSigned,
  ensureVessel,
  readParam,
} from './runtimeCore';

export function setVesselParams(
  vesselPtr: usize,
  modelId: i32,
  paramsPtr: usize,
  paramsLen: i32,
): void {
  const vessel = ensureVessel(vesselPtr);
  vessel.modelId = modelId;
  if (paramsPtr === 0 || paramsLen <= 0) return;

  const params = changetype<StaticArray<f64>>(paramsPtr);
  const len = paramsLen > 0 ? paramsLen : 0;
  if (modelId !== MODEL_DISPLACEMENT) return;

  const mass = readParam(params, len, PARAM_MASS, vessel.mass);
  if (mass > 0.0) vessel.mass = mass;

  const length = readParam(params, len, PARAM_LENGTH, vessel.length);
  if (length > 0.0) vessel.length = length;

  const beam = readParam(params, len, PARAM_BEAM, vessel.beam);
  if (beam > 0.0) vessel.beam = beam;

  const draft = readParam(params, len, PARAM_DRAFT, vessel.draft);
  if (draft > 0.0) vessel.draft = draft;

  const blockCoefficient = readParam(
    params,
    len,
    PARAM_BLOCK_COEFFICIENT,
    vessel.blockCoefficient,
  );
  if (blockCoefficient > 0.0) vessel.blockCoefficient = blockCoefficient;

  const rudderForceCoefficient = readParam(
    params,
    len,
    PARAM_RUDDER_FORCE_COEFFICIENT,
    vessel.rudderForceCoefficient,
  );
  if (rudderForceCoefficient >= 0.0) {
    vessel.rudderForceCoefficient = rudderForceCoefficient;
  }

  const rudderStallAngle = readParam(
    params,
    len,
    PARAM_RUDDER_STALL_ANGLE,
    vessel.rudderStallAngle,
  );
  if (rudderStallAngle > 0.0) vessel.rudderStallAngle = rudderStallAngle;

  const rudderMaxAngle = readParam(
    params,
    len,
    PARAM_RUDDER_MAX_ANGLE,
    vessel.rudderMaxAngle,
  );
  if (rudderMaxAngle > 0.0) vessel.rudderMaxAngle = rudderMaxAngle;

  const dragCoefficient = readParam(
    params,
    len,
    PARAM_DRAG_COEFFICIENT,
    vessel.dragCoefficient,
  );
  if (dragCoefficient >= 0.0) vessel.dragCoefficient = dragCoefficient;

  const yawDamping = readParam(
    params,
    len,
    PARAM_YAW_DAMPING,
    vessel.yawDamping,
  );
  if (yawDamping >= 0.0) vessel.yawDamping = yawDamping;

  const yawDampingQuad = readParam(
    params,
    len,
    PARAM_YAW_DAMPING_QUAD,
    vessel.yawDampingQuad,
  );
  if (yawDampingQuad >= 0.0) vessel.yawDampingQuad = yawDampingQuad;

  const swayDamping = readParam(
    params,
    len,
    PARAM_SWAY_DAMPING,
    vessel.swayDamping,
  );
  if (swayDamping >= 0.0) vessel.swayDamping = swayDamping;

  const maxThrust = readParam(params, len, PARAM_MAX_THRUST, vessel.maxThrust);
  if (maxThrust >= 0.0) vessel.maxThrust = maxThrust;

  const maxSpeed = readParam(params, len, PARAM_MAX_SPEED, vessel.maxSpeed);
  if (maxSpeed > 0.0) vessel.maxSpeed = maxSpeed;

  const rollDamping = readParam(
    params,
    len,
    PARAM_ROLL_DAMPING,
    vessel.rollDamping,
  );
  if (rollDamping >= 0.0) vessel.rollDamping = rollDamping;

  const pitchDamping = readParam(
    params,
    len,
    PARAM_PITCH_DAMPING,
    vessel.pitchDamping,
  );
  if (pitchDamping >= 0.0) vessel.pitchDamping = pitchDamping;

  const heaveStiffness = readParam(
    params,
    len,
    PARAM_HEAVE_STIFFNESS,
    vessel.heaveStiffness,
  );
  if (heaveStiffness >= 0.0) vessel.heaveStiffness = heaveStiffness;

  const heaveDamping = readParam(
    params,
    len,
    PARAM_HEAVE_DAMPING,
    vessel.heaveDamping,
  );
  if (heaveDamping >= 0.0) vessel.heaveDamping = heaveDamping;

  const rudderArea = readParam(
    params,
    len,
    PARAM_RUDDER_AREA,
    vessel.rudderArea,
  );
  if (rudderArea > 0.0) vessel.rudderArea = rudderArea;

  const rudderArm = readParam(params, len, PARAM_RUDDER_ARM, vessel.rudderArm);
  if (rudderArm > 0.0) vessel.rudderArm = rudderArm;

  const rudderLiftSlope = readParam(
    params,
    len,
    PARAM_RUDDER_LIFT_SLOPE,
    vessel.rudderLiftSlope,
  );
  if (rudderLiftSlope > 0.0) vessel.rudderLiftSlope = rudderLiftSlope;

  const propWashFactor = readParam(
    params,
    len,
    PARAM_PROP_WASH,
    vessel.propWashFactor,
  );
  if (propWashFactor >= 0.0) vessel.propWashFactor = propWashFactor;

  const engineTimeConstant = readParam(
    params,
    len,
    PARAM_ENGINE_TIME_CONSTANT,
    vessel.engineTimeConstant,
  );
  if (engineTimeConstant > 0.0) vessel.engineTimeConstant = engineTimeConstant;

  const rudderRateLimit = readParam(
    params,
    len,
    PARAM_RUDDER_RATE,
    vessel.rudderRateLimit,
  );
  if (rudderRateLimit > 0.0) vessel.rudderRateLimit = rudderRateLimit;

  const addedMassX = readParam(
    params,
    len,
    PARAM_ADDED_MASS_X,
    vessel.addedMassX,
  );
  if (addedMassX >= 0.0) vessel.addedMassX = addedMassX;

  const addedMassY = readParam(
    params,
    len,
    PARAM_ADDED_MASS_Y,
    vessel.addedMassY,
  );
  if (addedMassY >= 0.0) vessel.addedMassY = addedMassY;

  const addedMassYaw = readParam(
    params,
    len,
    PARAM_ADDED_MASS_YAW,
    vessel.addedMassYaw,
  );
  if (addedMassYaw >= 0.0) vessel.addedMassYaw = addedMassYaw;

  vessel.hullYv = readParam(params, len, PARAM_HULL_YV, vessel.hullYv);
  vessel.hullYr = readParam(params, len, PARAM_HULL_YR, vessel.hullYr);
  vessel.hullNv = readParam(params, len, PARAM_HULL_NV, vessel.hullNv);
  vessel.hullNr = readParam(params, len, PARAM_HULL_NR, vessel.hullNr);

  const cdSurge = readParam(params, len, PARAM_CD_SURGE, vessel.cdSurge);
  if (cdSurge > 0.0) vessel.cdSurge = cdSurge;

  const cdSway = readParam(params, len, PARAM_CD_SWAY, vessel.cdSway);
  if (cdSway > 0.0) vessel.cdSway = cdSway;

  const cdYaw = readParam(params, len, PARAM_CD_YAW, vessel.cdYaw);
  if (cdYaw > 0.0) vessel.cdYaw = cdYaw;

  const shallowWaterFactor = readParam(
    params,
    len,
    PARAM_SHALLOW_WATER_FACTOR,
    vessel.shallowWaterFactor,
  );
  if (shallowWaterFactor >= 0.0) vessel.shallowWaterFactor = shallowWaterFactor;

  const shallowWaterYawFactor = readParam(
    params,
    len,
    PARAM_SHALLOW_WATER_YAW_FACTOR,
    vessel.shallowWaterYawFactor,
  );
  if (shallowWaterYawFactor >= 0.0) {
    vessel.shallowWaterYawFactor = shallowWaterYawFactor;
  }

  const shallowWaterRudderFactor = readParam(
    params,
    len,
    PARAM_SHALLOW_WATER_RUDDER_FACTOR,
    vessel.shallowWaterRudderFactor,
  );
  if (shallowWaterRudderFactor >= 0.0) {
    vessel.shallowWaterRudderFactor = shallowWaterRudderFactor;
  }

  vessel.rudderCommand = clampSigned(
    vessel.rudderCommand,
    vessel.rudderMaxAngle,
  );
  vessel.rudderAngle = clampSigned(vessel.rudderAngle, vessel.rudderMaxAngle);
}
