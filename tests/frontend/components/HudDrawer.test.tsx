import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const applyControlsMock = jest.fn();
const refreshPhysicsParamsMock = jest.fn();

const socketManagerMock = {
  sendControlUpdate: jest.fn(),
  sendAdminVesselMove: jest.fn(),
  setJoinPreference: jest.fn(),
  requestJoinVessel: jest.fn(),
  requestStation: jest.fn(),
  requestRepair: jest.fn(),
};

const setNoticeMock = jest.fn();
const setAccountMock = jest.fn();
const setPhysicsParamsMock = jest.fn();
const upsertMissionAssignmentMock = jest.fn();
const startReplayRecordingMock = jest.fn();
const stopReplayRecordingMock = jest.fn();
const startReplayPlaybackMock = jest.fn();
const stopReplayPlaybackMock = jest.fn();
const clearReplayMock = jest.fn();
const chatPanelPropsMock = jest.fn();
type CallbackProps = Record<string, (...args: unknown[]) => void>;

const storeState: Record<string, unknown> = {
  mode: 'player',
  roles: ['admin', 'player'],
  sessionUserId: 'user-1',
  crewIds: ['user-1'],
  crewNames: { 'user-1': 'Captain' },
  setNotice: setNoticeMock,
  account: {
    rank: 1,
    experience: 200,
    credits: 1000,
    safetyScore: 0.95,
  },
  setAccount: setAccountMock,
  setPhysicsParams: setPhysicsParamsMock,
  missions: [{ id: 'm1', name: 'Mission 1' }],
  missionAssignments: [{ missionId: 'm0', status: 'assigned' }],
  upsertMissionAssignment: upsertMissionAssignmentMock,
  socketLatencyMs: 42,
  replay: {
    frames: [{ timestamp: 1000 }, { timestamp: 2000 }],
  },
  startReplayRecording: startReplayRecordingMock,
  stopReplayRecording: stopReplayRecordingMock,
  startReplayPlayback: startReplayPlaybackMock,
  stopReplayPlayback: stopReplayPlaybackMock,
  clearReplay: clearReplayMock,
  currentVesselId: 'own-vessel',
  spaceId: 'global',
  otherVessels: {
    'other-vessel': {
      spaceId: 'global',
      position: { lat: 60.171, lon: 24.941 },
      orientation: { heading: 0.4 },
      velocity: { surge: 2, sway: 0, heave: 0 },
      properties: { length: 80, beam: 14, name: 'Other' },
      helm: { username: 'Other Helm' },
    },
  },
  vessel: {
    position: { lat: 60.17, lon: 24.94, z: 0 },
    orientation: { heading: 0.2, roll: 0.01, pitch: 0.02 },
    velocity: { surge: 4, sway: 1, heave: 0 },
    angularVelocity: { yaw: 0.01, roll: 0, pitch: 0 },
    controls: { throttle: 0.4, rudderAngle: 0.05, ballast: 0.5 },
    properties: {
      mass: 100000,
      length: 120,
      beam: 20,
      draft: 6,
      blockCoefficient: 0.8,
      name: 'Own Ship',
    },
    engineState: {
      rpm: 1200,
      fuelLevel: 0.8,
      fuelConsumption: 2.2,
      temperature: 72,
      oilPressure: 4.5,
      load: 0.6,
      running: true,
      hours: 100,
    },
    electricalSystem: {
      mainBusVoltage: 440,
      generatorOutput: 120,
      batteryLevel: 0.9,
      powerConsumption: 80,
      generatorRunning: true,
    },
    stability: {
      metacentricHeight: 2.2,
      centerOfGravity: { x: 0, y: 0, z: 7 },
      trim: 0.1,
      list: 0.2,
    },
    alarms: {
      engineOverheat: false,
      lowOilPressure: false,
      lowFuel: false,
      fireDetected: false,
      collisionAlert: false,
      stabilityWarning: false,
      generatorFault: false,
      blackout: false,
      otherAlarms: { customAlarm: true },
    },
    damageState: {},
    failureState: {},
    waterDepth: 30,
    helm: { userId: 'user-1', username: 'Captain' },
    stations: {
      helm: { userId: 'user-1', username: 'Captain' },
      engine: { userId: null, username: null },
      radio: { userId: null, username: null },
    },
  },
  environment: {
    wind: { speed: 5, direction: 0.3, gusting: false, gustFactor: 1.2 },
    current: { speed: 0.4, direction: 0.1, variability: 0 },
    seaState: 2,
    waveHeight: 1.2,
    timeOfDay: 12,
    visibility: 10,
    precipitationIntensity: 0.1,
    waterDepth: 50,
  },
};

const useStoreMock = (selector: (state: Record<string, unknown>) => unknown) =>
  selector(storeState);
useStoreMock.getState = () => storeState;

const fetchMock = jest.fn(async (input: RequestInfo | URL) => {
  const url = String(input);
  if (url.endsWith('/api/missions/m1/assign')) {
    return {
      ok: true,
      status: 200,
      json: async () => ({
        assignment: { missionId: 'm1', status: 'assigned' },
      }),
    } as Response;
  }
  if (url.endsWith('/api/economy/summary')) {
    return {
      ok: true,
      status: 200,
      json: async () => ({
        profile: {
          rank: 2,
          experience: 400,
          credits: 1200,
          safetyScore: 0.91,
        },
        transactions: [{ id: 'tx1', amount: 10 }],
      }),
    } as Response;
  }
  if (url.endsWith('/api/economy/fleet')) {
    return {
      ok: true,
      status: 200,
      json: async () => ({ fleet: [{ id: 'fleet-1', spaceId: 'global' }] }),
    } as Response;
  }
  if (url.endsWith('/api/economy/ports')) {
    return {
      ok: true,
      status: 200,
      json: async () => ({
        ports: [
          { id: 'harbor-alpha', name: 'Harbor', position: { lat: 0, lon: 0 } },
        ],
      }),
    } as Response;
  }
  return { ok: true, status: 200, json: async () => ({}) } as Response;
});

jest.mock('../../../src/store', () => ({
  __esModule: true,
  default: (selector: (state: Record<string, unknown>) => unknown) =>
    useStoreMock(selector),
}));

jest.mock('../../../src/simulation', () => ({
  getSimulationLoop: () => ({
    applyControls: applyControlsMock,
    refreshPhysicsParams: refreshPhysicsParamsMock,
  }),
}));

jest.mock('../../../src/networking/socket', () => ({
  __esModule: true,
  socketManager: socketManagerMock,
}));

jest.mock('../../../src/lib/api', () => ({
  getApiBase: () => 'http://api.test',
}));

jest.mock('../../../src/components/hud/panels/HudAdminPanel', () => ({
  HudAdminPanel: ({ onMove, onMoveToSelf }: CallbackProps) => (
    <div>
      <button onClick={onMove} type="button">
        Admin move
      </button>
      <button onClick={onMoveToSelf} type="button">
        Admin move to self
      </button>
    </div>
  ),
}));

jest.mock('../../../src/components/hud/panels/HudAlarmsPanel', () => ({
  HudAlarmsPanel: () => <div>Alarms panel</div>,
}));

jest.mock('../../../src/components/hud/panels/HudChatPanel', () => ({
  HudChatPanel: (props: unknown) => {
    chatPanelPropsMock(props);
    return <div>Chat panel</div>;
  },
}));

jest.mock('../../../src/components/hud/panels/HudConningPanel', () => ({
  HudConningPanel: () => <div>Conning panel</div>,
}));

jest.mock('../../../src/components/hud/panels/HudNavControls', () => ({
  HudNavControls: ({
    setThrottleLocal,
    setRudderAngleLocal,
  }: {
    setThrottleLocal: (value: number) => void;
    setRudderAngleLocal: (value: number) => void;
  }) => (
    <div>
      <button onClick={() => setThrottleLocal(0.6)} type="button">
        Set throttle
      </button>
      <button onClick={() => setRudderAngleLocal(0.1)} type="button">
        Set rudder
      </button>
    </div>
  ),
}));

jest.mock('../../../src/components/hud/panels/HudCrewPanel', () => ({
  HudCrewPanel: ({ onRequestStation }: CallbackProps) => (
    <button onClick={() => onRequestStation('helm', 'claim')} type="button">
      Request station
    </button>
  ),
}));

jest.mock('../../../src/components/hud/panels/HudEcdisPanel', () => ({
  HudEcdisPanel: () => <div>ECDIS panel</div>,
}));

jest.mock('../../../src/components/hud/panels/HudEventsPanel', () => ({
  HudEventsPanel: () => <div>Events panel</div>,
}));

jest.mock('../../../src/components/hud/panels/HudMissionsPanel', () => ({
  HudMissionsPanel: ({ onAssignMission }: CallbackProps) => (
    <button onClick={() => onAssignMission('m1')} type="button">
      Assign mission
    </button>
  ),
}));

jest.mock('../../../src/components/hud/panels/HudNavigationPanel', () => ({
  HudNavigationPanel: () => <div>Navigation panel</div>,
}));

jest.mock('../../../src/components/hud/panels/HudRadarPanel', () => ({
  HudRadarPanel: () => <div>Radar panel</div>,
}));

jest.mock('../../../src/components/hud/panels/HudRadioPanel', () => ({
  HudRadioPanel: () => <div>Radio panel</div>,
}));

jest.mock('../../../src/components/hud/panels/HudReplayPanel', () => ({
  HudReplayPanel: () => <div>Replay panel</div>,
}));

jest.mock('../../../src/components/hud/panels/HudSounderPanel', () => ({
  HudSounderPanel: () => <div>Sounder panel</div>,
}));

jest.mock('../../../src/components/hud/panels/HudSystemsPanel', () => ({
  HudSystemsPanel: ({ onRequestRepair }: CallbackProps) => (
    <button onClick={onRequestRepair} type="button">
      Request repair
    </button>
  ),
}));

jest.mock('../../../src/components/hud/panels/HudVesselsPanel', () => ({
  HudVesselsPanel: ({ onJoinVessel }: CallbackProps) => (
    <button onClick={() => onJoinVessel('other-vessel')} type="button">
      Join vessel
    </button>
  ),
}));

jest.mock('../../../src/components/hud/panels/HudWeatherPanel', () => ({
  HudWeatherPanel: () => <div>Weather panel</div>,
}));

jest.mock('../../../src/components/hud/PhysicsInspectorPanel', () => ({
  HudPhysicsInspectorPanel: ({ onApplyParams }: CallbackProps) => (
    <button
      onClick={() => onApplyParams({ dragCoefficient: 0.33 })}
      type="button"
    >
      Apply physics params
    </button>
  ),
}));

import { HudDrawer } from '../../../src/components/HudDrawer';

describe('HudDrawer', () => {
  const snapshot = JSON.parse(JSON.stringify(storeState));

  beforeEach(() => {
    jest.clearAllMocks();
    chatPanelPropsMock.mockClear();
    global.fetch = fetchMock as typeof fetch;
    Object.assign(storeState, JSON.parse(JSON.stringify(snapshot)));
    storeState.setNotice = setNoticeMock;
    storeState.setAccount = setAccountMock;
    storeState.setPhysicsParams = setPhysicsParamsMock;
    storeState.upsertMissionAssignment = upsertMissionAssignmentMock;
    storeState.startReplayRecording = startReplayRecordingMock;
    storeState.stopReplayRecording = stopReplayRecordingMock;
    storeState.startReplayPlayback = startReplayPlaybackMock;
    storeState.stopReplayPlayback = stopReplayPlaybackMock;
    storeState.clearReplay = clearReplayMock;
  });

  it('renders tabs and drives core interactions', async () => {
    const onOpenSpaces = jest.fn();
    render(<HudDrawer onOpenSpaces={onOpenSpaces} />);

    expect(screen.getByText(/HUD • Player mode/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(applyControlsMock).toHaveBeenCalled();
      expect(socketManagerMock.sendControlUpdate).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Vessels' }));
    fireEvent.click(screen.getByRole('button', { name: 'Join vessel' }));
    expect(socketManagerMock.setJoinPreference).toHaveBeenCalledWith(
      'player',
      true,
    );
    expect(socketManagerMock.requestJoinVessel).toHaveBeenCalledWith(
      'other-vessel',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Crew & stations' }));
    fireEvent.click(screen.getByRole('button', { name: 'Request station' }));
    expect(socketManagerMock.requestStation).toHaveBeenCalledWith(
      'helm',
      'claim',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Systems' }));
    fireEvent.click(screen.getByRole('button', { name: 'Request repair' }));
    expect(socketManagerMock.requestRepair).toHaveBeenCalledWith('own-vessel');

    fireEvent.click(screen.getByRole('button', { name: 'Missions' }));
    fireEvent.click(screen.getByRole('button', { name: 'Assign mission' }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/api/missions/m1/assign',
        expect.objectContaining({ method: 'POST' }),
      );
    });
    expect(upsertMissionAssignmentMock).toHaveBeenCalledWith({
      missionId: 'm1',
      status: 'assigned',
    });

    fireEvent.click(screen.getByRole('button', { name: 'Admin' }));
    fireEvent.click(screen.getByRole('button', { name: 'Admin move' }));
    expect(setNoticeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        message: expect.stringContaining('Enter coordinates'),
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Admin move to self' }));
    expect(socketManagerMock.sendAdminVesselMove).toHaveBeenCalledWith(
      'own-vessel',
      expect.objectContaining({
        lat: 60.17,
        lon: 24.94,
      }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Debug' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Apply physics params' }),
    );
    expect(setPhysicsParamsMock).toHaveBeenCalledWith({
      dragCoefficient: 0.33,
    });
    expect(refreshPhysicsParamsMock).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Spaces' }));
    expect(onOpenSpaces).toHaveBeenCalled();
  });

  it('hides admin/debug/crew controls in spectator mode', () => {
    storeState.mode = 'spectator';
    storeState.roles = ['player'];
    storeState.sessionUserId = 'user-2';
    const onOpenSpaces = jest.fn();

    render(<HudDrawer onOpenSpaces={onOpenSpaces} />);

    expect(
      screen.queryByRole('button', { name: 'Admin' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Debug' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Crew & stations' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Set throttle')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Spaces' }));
    expect(onOpenSpaces).toHaveBeenCalled();
  });

  it('updates chat panel props when selected space or vessel changes', async () => {
    const { rerender } = render(<HudDrawer />);

    fireEvent.click(screen.getByRole('button', { name: 'Chat' }));
    await waitFor(() => {
      expect(chatPanelPropsMock).toHaveBeenCalled();
    });

    let latestChatProps = chatPanelPropsMock.mock.calls.at(-1)?.[0];
    expect(latestChatProps).toEqual(
      expect.objectContaining({
        spaceId: 'global',
        currentVesselId: 'own-vessel',
      }),
    );

    storeState.spaceId = 'space-2';
    storeState.currentVesselId = 'vessel-2';
    rerender(<HudDrawer />);

    await waitFor(() => {
      latestChatProps = chatPanelPropsMock.mock.calls.at(-1)?.[0];
      expect(latestChatProps).toEqual(
        expect.objectContaining({
          spaceId: 'space-2',
          currentVesselId: 'vessel-2',
        }),
      );
    });
  });
});
