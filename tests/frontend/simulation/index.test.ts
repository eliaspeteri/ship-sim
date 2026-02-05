import {
  initializeSimulation,
  startSimulation,
  getSimulationLoop as getSimulationLoopExport,
} from '../../../src/simulation';
import { getSimulationLoop } from '../../../src/simulation/simulationLoop';

jest.mock('../../../src/simulation/simulationLoop', () => ({
  getSimulationLoop: jest.fn(),
}));

describe('simulation index', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('initializes the simulation loop', async () => {
    const initialize = jest.fn().mockResolvedValue(undefined);
    const start = jest.fn();
    (getSimulationLoop as jest.Mock).mockReturnValue({ initialize, start });

    await initializeSimulation();

    expect(getSimulationLoop).toHaveBeenCalled();
    expect(initialize).toHaveBeenCalled();
  });

  it('starts the simulation loop', () => {
    const initialize = jest.fn();
    const start = jest.fn();
    (getSimulationLoop as jest.Mock).mockReturnValue({ initialize, start });

    startSimulation();

    expect(getSimulationLoop).toHaveBeenCalled();
    expect(start).toHaveBeenCalled();
  });

  it('re-exports getSimulationLoop', () => {
    expect(getSimulationLoopExport).toBe(getSimulationLoop);
  });
});
