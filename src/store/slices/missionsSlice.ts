import { defaultAccountState } from '../defaults';

import type { SimulationState, StoreSet } from '../types';

type MissionsSlice = Pick<
  SimulationState,
  | 'missions'
  | 'missionAssignments'
  | 'setMissions'
  | 'setMissionAssignments'
  | 'upsertMissionAssignment'
  | 'account'
  | 'setAccount'
>;

export const createMissionsSlice = (set: StoreSet): MissionsSlice => ({
  missions: [],
  missionAssignments: [],
  setMissions: missions => set({ missions }),
  setMissionAssignments: assignments =>
    set({ missionAssignments: assignments }),
  upsertMissionAssignment: assignment =>
    set(state => {
      const existing = state.missionAssignments.find(
        current => current.id === assignment.id,
      );
      if (!existing) {
        return {
          missionAssignments: [...state.missionAssignments, assignment],
        };
      }
      return {
        missionAssignments: state.missionAssignments.map(current =>
          current.id === assignment.id ? assignment : current,
        ),
      };
    }),
  account: defaultAccountState,
  setAccount: account =>
    set(state => ({
      account: {
        ...state.account,
        ...account,
      },
    })),
});
