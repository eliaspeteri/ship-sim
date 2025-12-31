// Ship simulator simulation manager
// Handles integration between WASM physics and application state

// Import the correct exports from the files
import { getSimulationLoop } from './simulationLoop';

// Export our simulation loop functions for use throughout the application
export const initializeSimulation = async (): Promise<void> => {
  console.info('Initializing simulation');
  const simulationLoop = getSimulationLoop();
  return simulationLoop.initialize();
};

export const startSimulation = (): void => {
  const simulationLoop = getSimulationLoop();
  simulationLoop.start();
};

// Re-export the getSimulationLoop function
export { getSimulationLoop };
