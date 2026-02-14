import React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import SimPage from '../../src/pages/sim';
import { socketManager } from '../../src/networking/socket';
import { initializeSimulation, startSimulation } from '../../src/simulation';
import {
  STORAGE_ACTIVE_VESSEL_KEY,
  STORAGE_JOIN_CHOICE_KEY,
  STORAGE_SPACE_KEY,
  STORAGE_SPACE_SELECTED_KEY,
} from '../../src/features/sim/constants';

const mockReplace = jest.fn();
const mockUseSession = jest.fn();
let routerQuery: Record<string, string> = {};
let routerIsReady = true;
type SpaceModalProps = {
  setNewSpaceName: (name: string) => void;
  setNewSpaceVisibility: (visibility: string) => void;
  setNewSpaceRulesetType: (rulesetType: string) => void;
  onCreateSpace: () => Promise<void>;
  onFetchSpaces: (input: {
    inviteToken?: string;
    password?: string;
  }) => Promise<void>;
};
type JoinChoiceModalProps = {
  onStartScenario: (scenario: {
    id: string;
    name: string;
    spawn?: { lat: number; lon: number };
  }) => Promise<void>;
};
let latestSpaceModalProps: SpaceModalProps | null = null;
let latestJoinChoiceProps: JoinChoiceModalProps | null = null;
const applyControls = jest.fn();
const flushPromises = async (ticks = 3) => {
  for (let i = 0; i < ticks; i += 1) {
    await Promise.resolve();
  }
};

const renderSimPage = async () => {
  render(<SimPage />);
  await act(async () => {
    await flushPromises();
  });
};

jest.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/sim',
    query: routerQuery,
    replace: mockReplace,
    isReady: routerIsReady,
  }),
}));

jest.mock('next-auth/react', () => ({
  useSession: () => mockUseSession(),
}));

type StoreState = {
  vessel: {
    position: { lat: number; lon: number; z?: number };
    orientation: { heading: number };
    controls: { throttle?: number; rudderAngle?: number; ballast?: number };
    failureState: Record<string, unknown>;
    damageState: Record<string, unknown>;
    stations?: {
      helm?: { userId?: string | null };
      engine?: { userId?: string | null };
    };
    helm?: { userId?: string | null; username?: string };
  };
  mode: 'player' | 'spectator';
  setMode: jest.Mock;
  updateVessel: jest.Mock;
  setSpaceId: jest.Mock;
  spaceId: string;
  roles: string[];
  notice: { type: 'info' | 'error'; message: string } | null;
  setNotice: jest.Mock;
  crewIds: string[];
  otherVessels: Record<string, unknown>;
  setSessionUserId: jest.Mock;
  sessionUserId?: string | null;
  setChatMessages: jest.Mock;
  currentVesselId: string | null;
  account: {
    rank: number;
    experience: number;
    credits: number;
    safetyScore: number;
  };
  setMissions: jest.Mock;
  setMissionAssignments: jest.Mock;
  seamarks: {
    bboxKey?: string | null;
    center?: { lat: number; lon: number } | null;
    updatedAt?: number | null;
    radiusMeters?: number | null;
  };
  setSeamarks: jest.Mock;
};

const createStoreState = (overrides: Partial<StoreState> = {}): StoreState => ({
  vessel: {
    position: { lat: 0, lon: 0, z: 0 },
    orientation: { heading: 0 },
    controls: { throttle: 0, rudderAngle: 0, ballast: 0 },
    failureState: {},
    damageState: {},
    stations: {},
    helm: { userId: null },
    ...(overrides.vessel || {}),
  },
  mode: 'spectator',
  setMode: jest.fn(),
  updateVessel: jest.fn(),
  setSpaceId: jest.fn(),
  spaceId: 'global',
  roles: [],
  notice: null,
  setNotice: jest.fn(),
  crewIds: [],
  otherVessels: {},
  setSessionUserId: jest.fn(),
  sessionUserId: null,
  setChatMessages: jest.fn(),
  currentVesselId: null,
  account: {
    rank: 1,
    experience: 0,
    credits: 0,
    safetyScore: 1,
  },
  setMissions: jest.fn(),
  setMissionAssignments: jest.fn(),
  seamarks: {
    bboxKey: null,
    center: null,
    updatedAt: null,
    radiusMeters: null,
  },
  setSeamarks: jest.fn(),
  ...overrides,
});

let storeState: StoreState = createStoreState();

const mockUseStore = jest.fn((selector: (state: StoreState) => unknown) =>
  selector(storeState),
);

jest.mock('../../src/store', () => {
  const useStore = (selector: (state: StoreState) => unknown) =>
    mockUseStore(selector);
  (useStore as typeof mockUseStore & { getState?: () => StoreState }).getState =
    () => storeState;
  return {
    __esModule: true,
    default: useStore,
  };
});

jest.mock('../../src/components/Scene', () => {
  const SceneMock = () => <div>Scene</div>;
  SceneMock.displayName = 'SceneMock';
  return SceneMock;
});
jest.mock('../../src/components/Dashboard', () => {
  const DashboardMock = () => <div>Dashboard</div>;
  DashboardMock.displayName = 'DashboardMock';
  return DashboardMock;
});
jest.mock('../../src/components/HudDrawer', () => ({
  HudDrawer: () => <div>HudDrawer</div>,
}));
jest.mock('../../src/features/sim/SpaceModal', () => ({
  SpaceModal: (props: SpaceModalProps) => {
    latestSpaceModalProps = props;
    return null;
  },
}));
jest.mock('../../src/features/sim/JoinChoiceModal', () => ({
  JoinChoiceModal: (props: JoinChoiceModalProps) => {
    latestJoinChoiceProps = props;
    return null;
  },
}));
jest.mock('../../src/networking/socket', () => ({
  __esModule: true,
  socketManager: {
    switchSpace: jest.fn(),
    setJoinPreference: jest.fn(),
    requestNewVessel: jest.fn(),
    requestSeamarksNearby: jest.fn(),
    waitForConnection: jest.fn().mockResolvedValue(undefined),
    waitForSelfSnapshot: jest.fn().mockResolvedValue(undefined),
    setAuthToken: jest.fn(),
    refreshAuth: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    requestJoinVessel: jest.fn(),
    sendControlUpdate: jest.fn(),
    notifyModeChange: jest.fn(),
    requestHelm: jest.fn(),
  },
}));
jest.mock('../../src/simulation', () => ({
  initializeSimulation: jest.fn().mockResolvedValue(undefined),
  startSimulation: jest.fn(),
  getSimulationLoop: () => ({
    applyControls,
  }),
}));
jest.mock('../../src/lib/scenarios', () => ({
  getScenarios: () => [],
}));
jest.mock('../../src/lib/api', () => ({
  getApiBase: () => '',
}));

const mockFetch = (impl?: (url: string, init?: RequestInit) => unknown) => {
  global.fetch = jest
    .fn()
    .mockImplementation((url: string, init?: RequestInit) => {
      if (impl) {
        return Promise.resolve(impl(url, init)) as Promise<Response>;
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ spaces: [] }),
      }) as Promise<Response>;
    }) as unknown as typeof fetch;
};

describe('Sim page', () => {
  beforeEach(() => {
    routerQuery = {};
    routerIsReady = true;
    mockReplace.mockReset();
    mockUseSession.mockReset();
    latestSpaceModalProps = null;
    latestJoinChoiceProps = null;
    storeState = createStoreState();
    jest.clearAllMocks();
    window.localStorage.clear();
    window.sessionStorage.clear();
    mockFetch();
  });

  it('renders guest banner and dismisses it', async () => {
    mockUseSession.mockReturnValue({
      status: 'unauthenticated',
      data: null,
    });

    await renderSimPage();

    await waitFor(() =>
      expect(screen.getByText('Guest mode')).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByLabelText('Dismiss guest banner'));
    expect(screen.queryByText('Guest mode')).not.toBeInTheDocument();
  });

  it('shows loading state while session loads', async () => {
    mockUseSession.mockReturnValue({
      status: 'loading',
      data: null,
    });

    await renderSimPage();

    expect(screen.getByText('Loading Ship Simulator')).toBeInTheDocument();
  });

  it('boots sim for authenticated users and handles top bar actions', async () => {
    mockUseSession.mockReturnValue({
      status: 'authenticated',
      data: {
        user: { id: 'user-1', role: 'player', name: 'Captain' },
        socketToken: 'socket-token',
      },
    });
    window.localStorage.setItem(STORAGE_SPACE_KEY, 'global');
    window.localStorage.setItem(STORAGE_SPACE_SELECTED_KEY, 'true');

    storeState = createStoreState({
      mode: 'player',
      crewIds: ['user-1'],
      sessionUserId: 'user-1',
      vessel: {
        helm: { userId: 'user-1', username: 'Captain' },
        stations: { helm: { userId: 'user-1' }, engine: { userId: 'user-1' } },
        position: {
          lat: 0,
          lon: 0,
          z: undefined,
        },
        orientation: {
          heading: 0,
        },
        controls: {
          throttle: undefined,
          rudderAngle: undefined,
          ballast: undefined,
        },
        failureState: {},
        damageState: {},
      },
    });

    mockFetch((url: string, init?: RequestInit) => {
      const target = String(url);
      if (target.includes('/api/missions/assignments')) {
        return { ok: true, json: async () => ({ assignments: [] }) };
      }
      if (target.includes('/api/missions')) {
        return { ok: true, json: async () => ({ missions: [] }) };
      }
      if (target.includes('/api/spaces')) {
        return { ok: true, json: async () => ({ spaces: [] }) };
      }
      if (target.includes('/api/spaces/known')) {
        return { ok: true, json: async () => ({}) };
      }
      if ((init?.method || 'GET') === 'POST') {
        return { ok: true, json: async () => ({}) };
      }
      return { ok: true, json: async () => ({}) };
    });

    await renderSimPage();

    await waitFor(() => expect(socketManager.connect).toHaveBeenCalledWith(''));
    await waitFor(() => expect(initializeSimulation).toHaveBeenCalled());
    await waitFor(() => expect(startSimulation).toHaveBeenCalled());

    fireEvent.click(screen.getByText('Create My Vessel'));
    expect(socketManager.setJoinPreference).toHaveBeenCalledWith(
      'player',
      true,
    );
    expect(socketManager.requestNewVessel).toHaveBeenCalled();
    expect(storeState.setNotice).toHaveBeenCalledWith({
      type: 'info',
      message: 'Requesting a new vessel...',
    });

    fireEvent.click(screen.getByText('Release Helm'));
    expect(socketManager.requestHelm).toHaveBeenCalledWith('release');

    fireEvent.click(screen.getByText('Player'));
    expect(storeState.setMode).toHaveBeenCalled();
  });

  it('auto-joins vessel when query includes vesselId', async () => {
    routerQuery = { vesselId: 'v-9' };
    mockUseSession.mockReturnValue({
      status: 'authenticated',
      data: {
        user: { id: 'user-1', role: 'player', name: 'Captain' },
      },
    });

    await renderSimPage();

    await waitFor(() =>
      expect(socketManager.requestJoinVessel).toHaveBeenCalledWith('v-9'),
    );
  });

  it('creates a space via SpaceModal handler', async () => {
    mockUseSession.mockReturnValue({
      status: 'authenticated',
      data: {
        user: { id: 'user-1', role: 'player', name: 'Captain' },
      },
    });

    mockFetch((url: string, init?: RequestInit) => {
      const target = String(url);
      if (target.endsWith('/api/spaces') && init?.method === 'POST') {
        return {
          ok: true,
          json: async () => ({
            id: 'harbor-1',
            name: 'Harbor Alpha',
            visibility: 'public',
            rulesetType: 'CASUAL',
          }),
        };
      }
      if (target.includes('/api/spaces/known')) {
        return { ok: true, json: async () => ({}) };
      }
      if (target.includes('/api/spaces')) {
        return { ok: true, json: async () => ({ spaces: [] }) };
      }
      return { ok: true, json: async () => ({}) };
    });

    await renderSimPage();

    await act(async () => {
      latestSpaceModalProps!.setNewSpaceName('Harbor Alpha');
      latestSpaceModalProps!.setNewSpaceVisibility('public');
      latestSpaceModalProps!.setNewSpaceRulesetType('CASUAL');
    });

    await act(async () => {
      await latestSpaceModalProps!.onCreateSpace();
    });

    expect(storeState.setSpaceId).toHaveBeenCalledWith('harbor-1');
    expect(socketManager.switchSpace).toHaveBeenCalledWith('harbor-1');
  });

  it('starts scenarios from the join choice modal', async () => {
    mockUseSession.mockReturnValue({
      status: 'authenticated',
      data: {
        user: { id: 'user-1', role: 'player', name: 'Captain' },
      },
    });

    mockFetch((url: string, init?: RequestInit) => {
      const target = String(url);
      if (target.includes('/api/scenarios/scn-1/start')) {
        return {
          ok: true,
          json: async () => ({
            space: { id: 'scenario-space' },
          }),
        };
      }
      if (target.includes('/api/spaces')) {
        return { ok: true, json: async () => ({ spaces: [] }) };
      }
      if ((init?.method || 'GET') === 'POST') {
        return { ok: true, json: async () => ({}) };
      }
      return { ok: true, json: async () => ({}) };
    });

    await renderSimPage();

    await act(async () => {
      await latestJoinChoiceProps!.onStartScenario({
        id: 'scn-1',
        name: 'Starter Scenario',
        spawn: { lat: 1, lon: 2 },
      });
    });

    expect(socketManager.requestNewVessel).toHaveBeenCalledWith({
      lat: 1,
      lon: 2,
    });
    expect(storeState.setMode).toHaveBeenCalledWith('player');
    expect(storeState.setNotice).toHaveBeenCalledWith({
      type: 'info',
      message: 'Scenario "Starter Scenario" started.',
    });
  });

  it('sends private space password in POST body instead of URL query', async () => {
    mockUseSession.mockReturnValue({
      status: 'authenticated',
      data: {
        user: { id: 'user-1', role: 'player', name: 'Captain' },
      },
    });
    mockFetch((url: string) => {
      const target = String(url);
      if (target.includes('/api/spaces/access')) {
        return { ok: true, json: async () => ({ spaces: [] }) };
      }
      if (target.includes('/api/spaces/known')) {
        return { ok: true, json: async () => ({}) };
      }
      if (target.includes('/api/spaces')) {
        return { ok: true, json: async () => ({ spaces: [] }) };
      }
      return { ok: true, json: async () => ({}) };
    });

    await renderSimPage();

    await act(async () => {
      await latestSpaceModalProps!.onFetchSpaces({
        inviteToken: 'invite-123',
        password: 'secret-password',
      });
    });

    const calls = (global.fetch as jest.Mock).mock.calls as Array<
      [string, RequestInit | undefined]
    >;
    const accessCall = calls.find(([url]) =>
      url.includes('/api/spaces/access'),
    );
    expect(accessCall).toBeDefined();
    expect(accessCall?.[0]).not.toContain('password=');
    expect(accessCall?.[1]?.method).toBe('POST');
    expect(JSON.parse(String(accessCall?.[1]?.body))).toMatchObject({
      inviteToken: 'invite-123',
      password: 'secret-password',
      includeKnown: true,
    });
  });

  it('updates controls from keyboard input', async () => {
    mockUseSession.mockReturnValue({
      status: 'authenticated',
      data: {
        user: { id: 'user-1', role: 'player', name: 'Captain' },
      },
    });

    storeState = createStoreState({
      mode: 'player',
      sessionUserId: 'user-1',
      vessel: {
        position: { lat: 10, lon: 20 },
        stations: { helm: { userId: 'user-1' }, engine: { userId: 'user-1' } },
        orientation: {
          heading: 0,
        },
        controls: {
          throttle: undefined,
          rudderAngle: undefined,
          ballast: undefined,
        },
        failureState: {},
        damageState: {},
      },
    });

    await renderSimPage();

    await waitFor(() => expect(screen.getByText('Scene')).toBeInTheDocument());

    act(() => {
      fireEvent.keyDown(window, { key: 'w' });
    });

    expect(storeState.updateVessel).toHaveBeenCalled();
  });

  it('defaults to spectator mode when role cannot drive', async () => {
    mockUseSession.mockReturnValue({
      status: 'authenticated',
      data: {
        user: { id: 'user-2', role: 'spectator', name: 'Guest' },
      },
    });

    storeState = createStoreState({
      mode: 'player',
    });

    await renderSimPage();

    await waitFor(() =>
      expect(storeState.setMode).toHaveBeenCalledWith('spectator'),
    );
    expect(socketManager.notifyModeChange).toHaveBeenCalledWith('spectator');
  });

  it('clears notices after the timeout', async () => {
    jest.useFakeTimers();
    mockUseSession.mockReturnValue({
      status: 'authenticated',
      data: {
        user: { id: 'user-1', role: 'player', name: 'Captain' },
      },
    });

    storeState = createStoreState({
      notice: { type: 'info', message: 'Heads up' },
    });

    await renderSimPage();

    act(() => {
      jest.runOnlyPendingTimers();
    });

    expect(storeState.setNotice).toHaveBeenCalledWith(null);
    jest.useRealTimers();
  });

  it('persists pending join from session storage', async () => {
    window.sessionStorage.setItem(STORAGE_JOIN_CHOICE_KEY, 'join');
    window.sessionStorage.setItem(STORAGE_ACTIVE_VESSEL_KEY, 'v-77');
    mockUseSession.mockReturnValue({
      status: 'authenticated',
      data: {
        user: { id: 'user-1', role: 'player', name: 'Captain' },
      },
    });

    await renderSimPage();

    await waitFor(() =>
      expect(socketManager.requestJoinVessel).toHaveBeenCalledWith('v-77'),
    );
  });
});
