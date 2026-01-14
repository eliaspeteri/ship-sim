export type FailureState = {
  engineFailure: boolean;
  steeringFailure: boolean;
  floodingLevel: number;
  engineFailureAt?: number | null;
  steeringFailureAt?: number | null;
};

export type FailureUpdateResult = {
  state: FailureState;
  triggered: {
    engineFailure: boolean;
    steeringFailure: boolean;
    flooding: boolean;
    engineRecovered: boolean;
    steeringRecovered: boolean;
  };
};

type FailureUpdateInput = {
  state?: Partial<FailureState> | null;
  dt: number;
  nowMs: number;
  throttle: number;
  rudderAngle: number;
  speed: number;
  waterDepth?: number;
  draft?: number;
  failuresEnabled: boolean;
  rng?: () => number;
};

const ENGINE_FAILURE_RATE = 1 / (8 * 3600);
const STEERING_FAILURE_RATE = 1 / (12 * 3600);
const FLOODING_RATE = 0.02;
const FLOODING_DRAIN_RATE = 0.005;
const MIN_REPAIR_DELAY_MS = 120_000;
const ENGINE_REPAIR_MEAN_SEC = 20 * 60;
const STEERING_REPAIR_MEAN_SEC = 25 * 60;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const ensureFailureState = (
  state?: Partial<FailureState> | null,
): FailureState => ({
  engineFailure: Boolean(state?.engineFailure),
  steeringFailure: Boolean(state?.steeringFailure),
  floodingLevel: clamp01(state?.floodingLevel ?? 0),
  engineFailureAt: state?.engineFailureAt ?? null,
  steeringFailureAt: state?.steeringFailureAt ?? null,
});

export const updateFailureState = (
  input: FailureUpdateInput,
): FailureUpdateResult => {
  const rng = input.rng || Math.random;
  const state = ensureFailureState(input.state);
  const triggered = {
    engineFailure: false,
    steeringFailure: false,
    flooding: false,
    engineRecovered: false,
    steeringRecovered: false,
  };

  if (!input.failuresEnabled) {
    return { state, triggered };
  }

  const throttle = Math.max(0, input.throttle);
  const speed = Math.max(0, input.speed);
  const rudderStress = Math.min(1, Math.abs(input.rudderAngle));

  if (!state.engineFailure && throttle > 0.1) {
    const stress = 0.2 + throttle * throttle * 1.2;
    const chance = ENGINE_FAILURE_RATE * input.dt * stress;
    if (rng() < chance) {
      state.engineFailure = true;
      state.engineFailureAt = input.nowMs;
      triggered.engineFailure = true;
    }
  }

  if (!state.steeringFailure && speed > 0.5 && rudderStress > 0.4) {
    const stress = rudderStress * (0.6 + Math.min(speed / 6, 1));
    const chance = STEERING_FAILURE_RATE * input.dt * stress;
    if (rng() < chance) {
      state.steeringFailure = true;
      state.steeringFailureAt = input.nowMs;
      triggered.steeringFailure = true;
    }
  }

  if (
    input.waterDepth !== undefined &&
    input.draft !== undefined &&
    input.waterDepth <= input.draft + 0.1
  ) {
    const next = clamp01(state.floodingLevel + FLOODING_RATE * input.dt);
    if (next !== state.floodingLevel) {
      state.floodingLevel = next;
      triggered.flooding = true;
    }
  } else if (state.floodingLevel > 0 && throttle < 0.1 && speed < 0.2) {
    state.floodingLevel = clamp01(
      state.floodingLevel - FLOODING_DRAIN_RATE * input.dt,
    );
  }

  if (
    state.engineFailure &&
    throttle < 0.05 &&
    speed < 0.2 &&
    state.engineFailureAt &&
    input.nowMs - state.engineFailureAt > MIN_REPAIR_DELAY_MS
  ) {
    const chance = input.dt / ENGINE_REPAIR_MEAN_SEC;
    if (rng() < chance) {
      state.engineFailure = false;
      state.engineFailureAt = null;
      triggered.engineRecovered = true;
    }
  }

  if (
    state.steeringFailure &&
    throttle < 0.05 &&
    speed < 0.2 &&
    state.steeringFailureAt &&
    input.nowMs - state.steeringFailureAt > MIN_REPAIR_DELAY_MS
  ) {
    const chance = input.dt / STEERING_REPAIR_MEAN_SEC;
    if (rng() < chance) {
      state.steeringFailure = false;
      state.steeringFailureAt = null;
      triggered.steeringRecovered = true;
    }
  }

  return { state, triggered };
};
