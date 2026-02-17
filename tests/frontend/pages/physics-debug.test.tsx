import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import PhysicsDebugPage, {
  getServerSideProps,
} from '../../../src/pages/physics-debug';

import type { GetServerSidePropsContext } from 'next';

const initializeSimulationMock = jest.fn(() => Promise.resolve());
const startSimulationMock = jest.fn();
const stopSimulationMock = jest.fn();
const readFileSyncMock = jest.fn();

const initialVessel = {
  position: { x: 0, y: 0, z: 0, lat: 0, lon: 0 },
  orientation: { heading: 0, roll: 0, pitch: 0 },
  velocity: { surge: 0, sway: 0, heave: 0 },
  angularVelocity: { yaw: 0, roll: 0, pitch: 0 },
  controls: { throttle: 0, rudderAngle: 0, ballast: 0.5, bowThruster: 0 },
  properties: {
    type: 'CONTAINER',
    modelPath: null,
    draft: 8,
    name: 'Debug',
    mass: 1,
    length: 1,
    beam: 1,
    blockCoefficient: 0.8,
    maxSpeed: 20,
  },
  render: {},
};

const initialEnvironment = {
  wind: { speed: 5, direction: 0, gusting: false, gustFactor: 1 },
  current: { speed: 0, direction: 0, variability: 0 },
  seaState: 2,
  timeOfDay: 12,
  waveLength: 40,
  waveDirection: 0,
};

const storeState = {
  vessel: {
    ...initialVessel,
  },
  environment: {
    ...initialEnvironment,
  },
  currentVesselId: 'v-1',
  setMode: jest.fn(),
  setSpaceId: jest.fn(),
  setCurrentVesselId: jest.fn(),
  setOtherVessels: jest.fn(),
  updateVessel: jest.fn((patch: Partial<typeof initialVessel>) => {
    storeState.vessel = { ...storeState.vessel, ...patch };
  }),
  applyVesselControls: jest.fn(
    (patch: Partial<typeof initialVessel.controls>) => {
      storeState.vessel.controls = { ...storeState.vessel.controls, ...patch };
    },
  ),
  updateEnvironment: jest.fn((patch: Partial<typeof initialEnvironment>) => {
    storeState.environment = { ...storeState.environment, ...patch };
  }),
};

jest.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="canvas">{children}</div>
  ),
  useFrame: () => {},
  useThree: () => ({ camera: { lookAt: jest.fn() } }),
}));

jest.mock('@react-three/drei', () => ({
  Environment: () => <div data-testid="env" />,
  OrbitControls: () => <div data-testid="orbit" />,
  Sky: () => <div data-testid="sky" />,
}));

jest.mock('fs', () => ({
  __esModule: true,
  default: { readFileSync: (...args: unknown[]) => readFileSyncMock(...args) },
  readFileSync: (...args: unknown[]) => readFileSyncMock(...args),
}));

jest.mock('../../../src/store', () => ({
  __esModule: true,
  default: Object.assign(
    (selector: (state: typeof storeState) => unknown) => selector(storeState),
    { getState: () => storeState },
  ),
}));

jest.mock('../../../src/simulation', () => ({
  initializeSimulation: () => initializeSimulationMock(),
  startSimulation: () => startSimulationMock(),
  getSimulationLoop: () => ({ stop: stopSimulationMock }),
}));

jest.mock('../../../src/components/OceanPatch', () => ({
  OceanPatch: () => <div data-testid="ocean-patch" />,
}));

jest.mock('../../../src/components/FarWater', () => ({
  FarWater: () => <div data-testid="far-water" />,
}));

jest.mock('../../../src/components/Ship', () => ({
  __esModule: true,
  default: () => <div data-testid="ship" />,
}));

jest.mock('../../../src/components/TelegraphLever', () => ({
  TelegraphLever: ({ onChange }: { onChange: (value: number) => void }) => (
    <button type="button" onClick={() => onChange(0.7)}>
      TelegraphLever
    </button>
  ),
}));

jest.mock('../../../src/components/HelmControl', () => ({
  HelmControl: ({ onChange }: { onChange: (value: number) => void }) => (
    <button type="button" onClick={() => onChange(10)}>
      HelmControl
    </button>
  ),
}));

jest.mock('../../../src/components/ControlLever', () => ({
  ControlLever: ({ onChange }: { onChange: (value: number) => void }) => (
    <button type="button" onClick={() => onChange(0.9)}>
      ControlLever
    </button>
  ),
}));

describe('pages/physics-debug', () => {
  beforeEach(() => {
    initializeSimulationMock.mockClear();
    startSimulationMock.mockClear();
    stopSimulationMock.mockClear();
    readFileSyncMock.mockReset();
    storeState.setMode.mockClear();
    storeState.setSpaceId.mockClear();
    storeState.setCurrentVesselId.mockClear();
    storeState.setOtherVessels.mockClear();
    storeState.updateVessel.mockClear();
    storeState.applyVesselControls.mockClear();
    storeState.updateEnvironment.mockClear();
  });

  it('renders debug UI and responds to controls', async () => {
    render(
      <PhysicsDebugPage
        templates={[
          {
            id: 'starter-container',
            name: 'Starter',
            shipType: 'CONTAINER',
            properties: {
              mass: 1,
              length: 2,
              beam: 3,
              draft: 4,
              blockCoefficient: 0.8,
              maxSpeed: 20,
            },
          },
        ]}
      />,
    );

    expect(screen.getByText('Physics Debug')).toBeInTheDocument();
    expect(screen.getByTestId('canvas')).toBeInTheDocument();
    await waitFor(() => expect(startSimulationMock).toHaveBeenCalled());
    expect(screen.getByText('WASM Running')).toBeInTheDocument();

    fireEvent.change(screen.getAllByRole('slider')[0], {
      target: { value: '12' },
    });
    expect(storeState.updateEnvironment).toHaveBeenCalled();
    (document.activeElement as HTMLElement | null)?.blur();

    storeState.applyVesselControls.mockClear();
    fireEvent.keyDown(window, { key: 'w' });
    expect(storeState.applyVesselControls).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Reset Sim State' }));
    expect(initializeSimulationMock).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'TelegraphLever' }));
    fireEvent.click(screen.getByRole('button', { name: 'HelmControl' }));
    fireEvent.click(screen.getByRole('button', { name: 'ControlLever' }));
    expect(storeState.applyVesselControls).toHaveBeenCalledTimes(4);
  });

  it('loads templates from catalog in getServerSideProps', async () => {
    readFileSyncMock.mockReturnValue(
      JSON.stringify([
        {
          id: 't1',
          name: 'Template One',
          shipType: 'CONTAINER',
          properties: {
            mass: 10,
            length: 20,
            beam: 5,
            draft: 3,
            blockCoefficient: 0.7,
            maxSpeed: 18,
          },
        },
        { id: '', name: '' },
      ]),
    );

    const result = (await getServerSideProps(
      {} as unknown as GetServerSidePropsContext,
    )) as { props: { templates: Array<{ id: string; name: string }> } };
    expect(result.props.templates).toHaveLength(1);
    expect(result.props.templates[0]).toEqual(
      expect.objectContaining({ id: 't1', name: 'Template One' }),
    );
  });

  it('falls back to default template when catalog load fails', async () => {
    readFileSyncMock.mockImplementation(() => {
      throw new Error('missing');
    });

    const result = (await getServerSideProps(
      {} as unknown as GetServerSidePropsContext,
    )) as { props: { templates: Array<{ id: string }> } };
    expect(result.props.templates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'starter-container' }),
      ]),
    );
  });
});
