import { DamageState, normalizeDamageState } from '../lib/damage';

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export const applyCollisionDamage = (
  state: DamageState,
  severity: number,
): DamageState => {
  const impact = clamp01(severity);
  return normalizeDamageState({
    hullIntegrity: state.hullIntegrity - impact * 0.1,
    engineHealth: state.engineHealth - impact * 0.04,
    steeringHealth: state.steeringHealth - impact * 0.05,
    electricalHealth: state.electricalHealth - impact * 0.03,
    floodingDamage: state.floodingDamage + impact * 0.06,
  });
};

export const applyGroundingDamage = (
  state: DamageState,
  dt: number,
  severity: number,
): DamageState => {
  const impact = clamp01(severity);
  const rate = Math.max(0, dt) * 0.0025 * impact;
  return normalizeDamageState({
    hullIntegrity: state.hullIntegrity - rate,
    steeringHealth: state.steeringHealth - rate * 0.4,
    floodingDamage: state.floodingDamage + rate * 1.2,
  });
};

export const applyFailureWear = (
  state: DamageState,
  engineFailure: boolean,
  steeringFailure: boolean,
): DamageState => {
  return normalizeDamageState({
    engineHealth: engineFailure
      ? state.engineHealth - 0.02
      : state.engineHealth,
    steeringHealth: steeringFailure
      ? state.steeringHealth - 0.02
      : state.steeringHealth,
  });
};

export const mergeDamageState = (current?: DamageState | null): DamageState =>
  normalizeDamageState(current);
