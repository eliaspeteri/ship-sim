import type { SimulationState, StoreSet } from '../types';
import {
  defaultEnvironmentState,
  defaultSeamarks,
  normalizeSeaState,
  shallowEqualEnv,
} from '../defaults';

type EnvironmentSlice = Pick<
  SimulationState,
  | 'environment'
  | 'updateEnvironment'
  | 'setDayNightCycle'
  | 'seamarks'
  | 'setSeamarks'
  | 'updateWaterStatus'
>;

export const createEnvironmentSlice = (set: StoreSet): EnvironmentSlice => ({
  environment: defaultEnvironmentState,
  updateEnvironment: environmentUpdate =>
    set(state => {
      const next = {
        ...state.environment,
        ...environmentUpdate,
        wind: { ...state.environment.wind, ...(environmentUpdate.wind || {}) },
        current: {
          ...state.environment.current,
          ...(environmentUpdate.current || {}),
        },
        seaState: normalizeSeaState(
          environmentUpdate.seaState ?? state.environment.seaState,
        ),
      };
      if (shallowEqualEnv(state.environment, next)) return {};
      return { environment: next };
    }),
  seamarks: defaultSeamarks,
  setSeamarks: next =>
    set(state => ({
      seamarks: { ...state.seamarks, ...next },
    })),
  setDayNightCycle: enabled => {
    if (enabled) {
      setInterval(() => {
        set(state => ({
          environment: {
            ...state.environment,
            timeOfDay: (state.environment.timeOfDay + 0.1) % 24,
          },
        }));
      }, 10000);
    }
  },
  updateWaterStatus:
    (_set: (state: SimulationState) => void, _get: () => SimulationState) =>
    (_state: SimulationState) => {
      // Intentionally left as legacy no-op.
    },
});
