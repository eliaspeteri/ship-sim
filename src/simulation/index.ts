// Ship simulator simulation manager
// Handles integration between WASM physics and application state

import { getSimulationLoop, SimulationLoop } from './simulationLoop';

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

// Export the simulation loop singleton for direct access where needed
export { getSimulationLoop };
