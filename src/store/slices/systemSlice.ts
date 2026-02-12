import type { SimulationState, StoreSet } from '../types';

type SystemSlice = Pick<
  SimulationState,
  | 'eventLog'
  | 'addEvent'
  | 'clearEventLog'
  | 'wasmVesselPtr'
  | 'setWasmVesselPtr'
  | 'wasmExports'
  | 'setWasmExports'
>;

export const createSystemSlice = (set: StoreSet): SystemSlice => ({
  eventLog: [],
  addEvent: event =>
    set(state => {
      const simTimeSeconds = Date.now() / 1000;
      const hours = Math.floor(simTimeSeconds / 3600);
      const minutes = Math.floor((simTimeSeconds % 3600) / 60);
      const seconds = Math.floor(simTimeSeconds % 60);
      const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      const newEvent = {
        ...event,
        id: Date.now().toString(),
        time: timeString,
        timestamp: Date.now(),
      };

      return {
        eventLog: [...state.eventLog, newEvent],
      };
    }),
  clearEventLog: () => set({ eventLog: [] }),
  wasmVesselPtr: null,
  setWasmVesselPtr: ptr => set({ wasmVesselPtr: ptr }),
  wasmExports: undefined,
  setWasmExports: exports => set({ wasmExports: exports }),
});
