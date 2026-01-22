import { DEFAULT_HYDRO } from '../constants/vessel';
import type { VesselState } from '../types/vessel.types';

const MS_PER_KNOT = 0.514444;
const DEFAULT_MASS = 14_950_000;
const DEFAULT_LENGTH = 212;
const DEFAULT_BEAM = 28;
const DEFAULT_DRAFT = 9.1;
const DEFAULT_BLOCK_COEFFICIENT = 0.8;
const DEFAULT_MAX_SPEED_KNOTS = 23;
const DEFAULT_RUDDER_AREA_RATIO = 0.02;
const DEFAULT_RUDDER_ARM_RATIO = 0.45;
const DEFAULT_RUDDER_LIFT_SLOPE = 6.0;
const DEFAULT_PROP_WASH = 0.6;
const DEFAULT_ENGINE_TIME_CONSTANT = 2.5;
const DEFAULT_RUDDER_RATE = 0.25;
const DEFAULT_ADDED_MASS_X_COEFF = 0.05;
const DEFAULT_ADDED_MASS_Y_COEFF = 0.2;
const DEFAULT_ADDED_MASS_YAW_COEFF = 0.02;
const DEFAULT_HULL_YV = 0.0;
const DEFAULT_HULL_YR = 0.0;
const DEFAULT_HULL_NV = 0.0;
const DEFAULT_HULL_NR = 0.0;
const DEFAULT_CD_SURGE = 0.7;
const DEFAULT_CD_SWAY_MULTIPLIER = 1.2;
const DEFAULT_CD_YAW_MULTIPLIER = 0.3;
const DEFAULT_SHALLOW_WATER_FACTOR = 1.5;
const DEFAULT_SHALLOW_WATER_YAW_FACTOR = 1.4;
const DEFAULT_SHALLOW_WATER_RUDDER_FACTOR = 0.7;

const PHYSICS_MODEL_IDS = {
  displacement: 0,
  planing: 1,
  sailing: 2,
  tow_assist: 3,
} as const;

const toNumber = (value: number | undefined, fallback: number) =>
  Number.isFinite(value) ? (value as number) : fallback;

const getOverride = (
  params: Record<string, number> | undefined,
  key: string,
  fallback: number,
) => toNumber(params?.[key], fallback);

export type PhysicsPayload = {
  modelId: number;
  params: number[];
};

export const buildDisplacementParams = (vessel: VesselState) => {
  const params = vessel.physics?.params;
  const hydro = vessel.hydrodynamics || DEFAULT_HYDRO;
  const properties = vessel.properties;

  const mass = getOverride(params, 'mass', toNumber(properties?.mass, DEFAULT_MASS));
  const length = getOverride(
    params,
    'length',
    toNumber(properties?.length, DEFAULT_LENGTH),
  );
  const beam = getOverride(params, 'beam', toNumber(properties?.beam, DEFAULT_BEAM));
  const draft = getOverride(
    params,
    'draft',
    toNumber(properties?.draft, DEFAULT_DRAFT),
  );
  const blockCoefficient = getOverride(
    params,
    'blockCoefficient',
    toNumber(properties?.blockCoefficient, DEFAULT_BLOCK_COEFFICIENT),
  );
  const maxSpeed = getOverride(
    params,
    'maxSpeed',
    toNumber(properties?.maxSpeed, DEFAULT_MAX_SPEED_KNOTS) * MS_PER_KNOT,
  );
  const baseCd = toNumber(hydro?.dragCoefficient, DEFAULT_CD_SURGE);

  return {
    mass,
    length,
    beam,
    draft,
    blockCoefficient,
    rudderForceCoefficient: getOverride(
      params,
      'rudderForceCoefficient',
      toNumber(hydro?.rudderForceCoefficient, DEFAULT_HYDRO.rudderForceCoefficient),
    ),
    rudderStallAngle: getOverride(
      params,
      'rudderStallAngle',
      toNumber(hydro?.rudderStallAngle, DEFAULT_HYDRO.rudderStallAngle),
    ),
    rudderMaxAngle: getOverride(
      params,
      'rudderMaxAngle',
      toNumber(hydro?.rudderMaxAngle, DEFAULT_HYDRO.rudderMaxAngle),
    ),
    dragCoefficient: getOverride(
      params,
      'dragCoefficient',
      toNumber(hydro?.dragCoefficient, DEFAULT_HYDRO.dragCoefficient),
    ),
    yawDamping: getOverride(
      params,
      'yawDamping',
      toNumber(hydro?.yawDamping, DEFAULT_HYDRO.yawDamping),
    ),
    yawDampingQuad: getOverride(
      params,
      'yawDampingQuad',
      toNumber(hydro?.yawDampingQuad, DEFAULT_HYDRO.yawDampingQuad),
    ),
    swayDamping: getOverride(
      params,
      'swayDamping',
      toNumber(hydro?.swayDamping, DEFAULT_HYDRO.swayDamping),
    ),
    maxThrust: getOverride(
      params,
      'maxThrust',
      toNumber(hydro?.maxThrust, DEFAULT_HYDRO.maxThrust),
    ),
    maxSpeed,
    rollDamping: getOverride(
      params,
      'rollDamping',
      toNumber(hydro?.rollDamping, DEFAULT_HYDRO.rollDamping),
    ),
    pitchDamping: getOverride(
      params,
      'pitchDamping',
      toNumber(hydro?.pitchDamping, DEFAULT_HYDRO.pitchDamping),
    ),
    heaveStiffness: getOverride(
      params,
      'heaveStiffness',
      toNumber(hydro?.heaveStiffness, DEFAULT_HYDRO.heaveStiffness),
    ),
    heaveDamping: getOverride(
      params,
      'heaveDamping',
      toNumber(hydro?.heaveDamping, DEFAULT_HYDRO.heaveDamping),
    ),
    rudderArea: getOverride(
      params,
      'rudderArea',
      length * draft * DEFAULT_RUDDER_AREA_RATIO,
    ),
    rudderArm: getOverride(
      params,
      'rudderArm',
      length * DEFAULT_RUDDER_ARM_RATIO,
    ),
    rudderLiftSlope: getOverride(
      params,
      'rudderLiftSlope',
      DEFAULT_RUDDER_LIFT_SLOPE,
    ),
    propWashFactor: getOverride(
      params,
      'propWashFactor',
      DEFAULT_PROP_WASH,
    ),
    engineTimeConstant: getOverride(
      params,
      'engineTimeConstant',
      DEFAULT_ENGINE_TIME_CONSTANT,
    ),
    rudderRateLimit: getOverride(
      params,
      'rudderRateLimit',
      DEFAULT_RUDDER_RATE,
    ),
    addedMassX: getOverride(
      params,
      'addedMassX',
      mass * DEFAULT_ADDED_MASS_X_COEFF,
    ),
    addedMassY: getOverride(
      params,
      'addedMassY',
      mass * DEFAULT_ADDED_MASS_Y_COEFF,
    ),
    addedMassYaw: getOverride(
      params,
      'addedMassYaw',
      mass * length * length * 0.1 * DEFAULT_ADDED_MASS_YAW_COEFF,
    ),
    hullYv: getOverride(params, 'hullYv', DEFAULT_HULL_YV),
    hullYr: getOverride(params, 'hullYr', DEFAULT_HULL_YR),
    hullNv: getOverride(params, 'hullNv', DEFAULT_HULL_NV),
    hullNr: getOverride(params, 'hullNr', DEFAULT_HULL_NR),
    cdSurge: getOverride(params, 'cdSurge', baseCd),
    cdSway: getOverride(params, 'cdSway', baseCd * DEFAULT_CD_SWAY_MULTIPLIER),
    cdYaw: getOverride(params, 'cdYaw', baseCd * DEFAULT_CD_YAW_MULTIPLIER),
    shallowWaterFactor: getOverride(
      params,
      'shallowWaterFactor',
      DEFAULT_SHALLOW_WATER_FACTOR,
    ),
    shallowWaterYawFactor: getOverride(
      params,
      'shallowWaterYawFactor',
      DEFAULT_SHALLOW_WATER_YAW_FACTOR,
    ),
    shallowWaterRudderFactor: getOverride(
      params,
      'shallowWaterRudderFactor',
      DEFAULT_SHALLOW_WATER_RUDDER_FACTOR,
    ),
  };
};

export const buildPhysicsPayload = (vessel: VesselState): PhysicsPayload => {
  const modelKey = vessel.physics?.model ?? 'displacement';
  const modelId =
    PHYSICS_MODEL_IDS[modelKey as keyof typeof PHYSICS_MODEL_IDS] ??
    PHYSICS_MODEL_IDS.displacement;
  const displacement = buildDisplacementParams(vessel);

  return {
    modelId,
    params: [
      displacement.mass,
      displacement.length,
      displacement.beam,
      displacement.draft,
      displacement.blockCoefficient,
      displacement.rudderForceCoefficient,
      displacement.rudderStallAngle,
      displacement.rudderMaxAngle,
      displacement.dragCoefficient,
      displacement.yawDamping,
      displacement.yawDampingQuad,
      displacement.swayDamping,
      displacement.maxThrust,
      displacement.maxSpeed,
      displacement.rollDamping,
      displacement.pitchDamping,
      displacement.heaveStiffness,
      displacement.heaveDamping,
      displacement.rudderArea,
      displacement.rudderArm,
      displacement.rudderLiftSlope,
      displacement.propWashFactor,
      displacement.engineTimeConstant,
      displacement.rudderRateLimit,
      displacement.addedMassX,
      displacement.addedMassY,
      displacement.addedMassYaw,
      displacement.hullYv,
      displacement.hullYr,
      displacement.hullNv,
      displacement.hullNr,
      displacement.cdSurge,
      displacement.cdSway,
      displacement.cdYaw,
      displacement.shallowWaterFactor,
      displacement.shallowWaterYawFactor,
      displacement.shallowWaterRudderFactor,
    ],
  };
};
