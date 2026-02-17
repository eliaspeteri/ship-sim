import { defaultMachinerySystemStatus } from '../defaults';

import type { SimulationState, StoreGet, StoreSet } from '../types';

type MachinerySlice = Pick<
  SimulationState,
  'machinerySystems' | 'updateMachineryStatus' | 'triggerFailure'
>;

export const createMachinerySlice = (
  set: StoreSet,
  get: StoreGet,
): MachinerySlice => ({
  machinerySystems: defaultMachinerySystemStatus,
  updateMachineryStatus: statusUpdate =>
    set(state => ({
      machinerySystems: {
        ...state.machinerySystems,
        ...statusUpdate,
        failures: {
          ...state.machinerySystems.failures,
          ...(statusUpdate.failures || {}),
        },
      },
    })),
  triggerFailure: (failureType, active) =>
    set(state => {
      const newMachinerySystems = {
        ...state.machinerySystems,
        failures: {
          ...state.machinerySystems.failures,
          [failureType]: active,
        },
      };

      if (failureType === 'engineFailure') {
        newMachinerySystems.engineHealth = active ? 0.2 : 1.0;
      } else if (failureType === 'propellerDamage') {
        newMachinerySystems.propulsionEfficiency = active ? 0.6 : 1.0;
      } else if (failureType === 'rudderFailure') {
        newMachinerySystems.steeringSystemHealth = active ? 0.3 : 1.0;
      } else if (failureType === 'electricalFailure') {
        newMachinerySystems.electricalSystemHealth = active ? 0.4 : 1.0;
      }

      if (active) {
        get().addEvent({
          category: 'alarm',
          type: failureType,
          message: `${failureType} has occurred!`,
          severity: 'critical',
        });
      }

      return { machinerySystems: newMachinerySystems };
    }),
});
