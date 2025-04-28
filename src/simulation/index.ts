// Ship simulator simulation manager
// Handles integration between WASM physics and application state

// Import the correct exports from the files
import useStore from '../store'; // Fixed import path
import { getSimulationLoop } from './simulationLoop';

// Export our simulation loop functions for use throughout the application
export const initializeSimulation = async (): Promise<void> => {
  const simulationLoop = getSimulationLoop();
  return simulationLoop.initialize();
};

export const startSimulation = (): void => {
  const simulationLoop = getSimulationLoop();
  simulationLoop.start();
};

export const stopSimulation = (): void => {
  const simulationLoop = getSimulationLoop();
  simulationLoop.stop();
};

export const togglePauseSimulation = (): void => {
  const simulationLoop = getSimulationLoop();
  simulationLoop.togglePause();
};

export const resetSimulation = (): void => {
  const simulationLoop = getSimulationLoop();
  simulationLoop.reset();
};

// Export the applyVesselControls function for use in MachineryPanel.tsx
export const applyVesselControls = (controls: {
  throttle?: number;
  rudderAngle?: number;
  ballast?: number;
  bowThruster?: number;
}): void => {
  try {
    const simulationLoop = getSimulationLoop();
    simulationLoop.applyControls(controls);
  } catch (error) {
    console.error('Error applying vessel controls:', error);

    // Update the store directly if the WASM call fails completely
    const state = useStore.getState();
    if (state.vessel.controls) {
      state.updateVessel({
        controls: {
          ...state.vessel.controls,
          ...controls,
        },
      });
    }
  }
};

// Re-export the getSimulationLoop function
export { getSimulationLoop };
