// Ship simulator simulation manager
// Handles integration between WASM physics and application state

import { _Physics } from './physics'; // Added underscore prefix
import { _SimulationLoop } from './simulationLoop'; // Already has underscore
import _useStore from '../store'; // Added underscore prefix

// Export our simulation loop functions for use throughout the application
export const initializeSimulation = async (): Promise<void> => {
  const simulationLoop = _SimulationLoop();
  return simulationLoop.initialize();
};

export const startSimulation = (): void => {
  const simulationLoop = _SimulationLoop();
  simulationLoop.start();
};

export const stopSimulation = (): void => {
  const simulationLoop = _SimulationLoop();
  simulationLoop.stop();
};

export const togglePauseSimulation = (): void => {
  const simulationLoop = _SimulationLoop();
  simulationLoop.togglePause();
};

export const resetSimulation = (): void => {
  const simulationLoop = _SimulationLoop();
  simulationLoop.reset();
};

// Export the simulation loop singleton for direct access where needed
export { _SimulationLoop as getSimulationLoop };
