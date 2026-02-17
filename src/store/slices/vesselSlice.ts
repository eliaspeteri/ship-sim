import { applyFailureControlLimits } from '../../lib/failureControls';
import { getSimulationLoop } from '../../simulation/simulationLoop';
import { defaultVesselState, hydrodynamicsForType } from '../defaults';
import { isValidVesselState, mergeVesselUpdate } from './vesselMerge';

import type { DeepPartial } from '../../types/utility';
import type { ShipType, VesselState } from '../../types/vessel.types';
import type { SimulationState, StoreGet, StoreSet } from '../types';


type VesselSlice = Pick<
  SimulationState,
  | 'vessel'
  | 'currentVesselId'
  | 'otherVessels'
  | 'resetVessel'
  | 'updateVessel'
  | 'setPhysicsParams'
  | 'setVesselName'
  | 'setVesselType'
  | 'setCurrentVesselId'
  | 'setOtherVessels'
  | 'applyVesselControls'
  | 'updateVesselProperties'
>;

export const createVesselSlice = (
  set: StoreSet,
  get: StoreGet,
): VesselSlice => ({
  vessel: defaultVesselState,
  currentVesselId: null,
  otherVessels: {},
  resetVessel: () => set({ vessel: defaultVesselState }),
  setCurrentVesselId: id => set({ currentVesselId: id || null }),
  setOtherVessels: vessels => set({ otherVessels: vessels }),
  updateVessel: (vesselUpdate: DeepPartial<VesselState>) =>
    set(state => {
      try {
        if (!isValidVesselState(state.vessel)) {
          throw new Error('Invalid vessel state');
        }
        return { vessel: mergeVesselUpdate(state.vessel, vesselUpdate) };
      } catch (error) {
        console.error('Error in updateVessel:', error);
        return {};
      }
    }),
  setPhysicsParams: params =>
    set(state => {
      const model = state.vessel.physics?.model ?? 'displacement';
      const schemaVersion = state.vessel.physics?.schemaVersion ?? 1;
      return {
        vessel: {
          ...state.vessel,
          physics: {
            model,
            schemaVersion,
            params,
          },
        },
      };
    }),
  setVesselName: name =>
    set(state => ({
      vessel: {
        ...state.vessel,
        properties: {
          ...state.vessel.properties,
          name,
        },
      },
    })),
  setVesselType: type =>
    set(state => ({
      vessel: {
        ...state.vessel,
        properties: {
          ...state.vessel.properties,
          type,
        },
        hydrodynamics: hydrodynamicsForType(type as ShipType),
      },
    })),
  applyVesselControls: controls => {
    try {
      const simulationLoop = getSimulationLoop();
      const failureState = get().vessel.failureState;
      const damageState = get().vessel.damageState;
      const nextControls = applyFailureControlLimits(
        controls,
        failureState,
        damageState,
      );
      set(state => ({
        vessel: {
          ...state.vessel,
          controls: {
            ...state.vessel.controls,
            ...nextControls,
          },
        },
      }));
      simulationLoop.applyControls(nextControls);
    } catch (error) {
      console.error('Error applying vessel controls to simulation:', error);
    }
  },
  updateVesselProperties:
    setState => (newProperties: Partial<VesselState['properties']>) => {
      setState((state: SimulationState) => ({
        vessel: {
          ...state.vessel,
          properties: {
            ...state.vessel.properties,
            ...newProperties,
          },
        },
      }));
    },
});
