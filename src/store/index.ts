import { create } from 'zustand';

import { createChatSlice } from './slices/chatSlice';
import { createEnvironmentSlice } from './slices/environmentSlice';
import { createMachinerySlice } from './slices/machinerySlice';
import { createMissionsSlice } from './slices/missionsSlice';
import { createNavigationSlice } from './slices/navigationSlice';
import { createSessionSlice } from './slices/sessionSlice';
import { createSystemSlice } from './slices/systemSlice';
import { createVesselSlice } from './slices/vesselSlice';

import type { SimulationState } from './types';

export type { AccountState } from './types';

const useStore = create<SimulationState>()((set, get) => ({
  ...createSessionSlice(set),
  ...createChatSlice(set),
  ...createMissionsSlice(set),
  ...createVesselSlice(set, get),
  ...createEnvironmentSlice(set),
  ...createSystemSlice(set),
  ...createMachinerySlice(set, get),
  ...createNavigationSlice(set),
}));

export default useStore;
