export type DamageState = {
  hullIntegrity: number;
  engineHealth: number;
  steeringHealth: number;
  electricalHealth: number;
  floodingDamage: number;
};

export const DEFAULT_DAMAGE_STATE: DamageState = {
  hullIntegrity: 1,
  engineHealth: 1,
  steeringHealth: 1,
  electricalHealth: 1,
  floodingDamage: 0,
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export const normalizeDamageState = (
  state?: Partial<DamageState> | null,
): DamageState => ({
  hullIntegrity: clamp01(state?.hullIntegrity ?? 1),
  engineHealth: clamp01(state?.engineHealth ?? 1),
  steeringHealth: clamp01(state?.steeringHealth ?? 1),
  electricalHealth: clamp01(state?.electricalHealth ?? 1),
  floodingDamage: clamp01(state?.floodingDamage ?? 0),
});

export const computeRepairCost = (state: DamageState): number => {
  const hull = 1 - state.hullIntegrity;
  const engine = 1 - state.engineHealth;
  const steering = 1 - state.steeringHealth;
  const electrical = 1 - state.electricalHealth;
  const flooding = state.floodingDamage;

  const base = 250;
  const cost =
    base +
    hull * 2500 +
    engine * 2000 +
    steering * 1500 +
    electrical * 1200 +
    flooding * 1800;
  return Math.max(0, Math.round(cost));
};

export const applyRepair = (): DamageState => ({
  hullIntegrity: 1,
  engineHealth: 1,
  steeringHealth: 1,
  electricalHealth: 1,
  floodingDamage: 0,
});
