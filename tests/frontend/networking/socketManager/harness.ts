import socketIoClient from 'socket.io-client';

import { createSocketManager } from '../../../../src/networking/socket';
import useStore from '../../../../src/store';

import type { SimulationState } from '../../../../src/store/types';

type SocketHandler = (payload?: unknown) => void;

type MockSocket = {
  connected: boolean;
  auth: Record<string, unknown>;
  on: jest.Mock;
  emit: jest.Mock;
  connect: jest.Mock;
  disconnect: jest.Mock;
};

export const flushPromises = async (ticks = 3): Promise<void> => {
  for (let i = 0; i < ticks; i += 1) {
    await Promise.resolve();
  }
};

export const createStoreState = (
  overrides: Partial<SimulationState> = {},
): SimulationState => {
  const base = useStore.getState();
  const state: SimulationState = {
    ...base,
    spaceId: 'harbor',
    roles: [],
    mode: 'player',
    sessionUserId: null,
    currentVesselId: null,
    otherVessels: {},
    chatHistoryMeta: {},
    chatMessages: [],
    seamarks: {
      bboxKey: null,
      center: null,
      radiusMeters: 0,
      features: null,
      updatedAt: null,
    },
    ...overrides,
  };

  state.setCurrentVesselId = jest.fn((vesselId: string | null) => {
    state.currentVesselId = vesselId;
  });
  state.setSpaceId = jest.fn((spaceId: string) => {
    state.spaceId = spaceId;
  });
  state.setMode = jest.fn((mode: 'player' | 'spectator') => {
    state.mode = mode;
  });
  state.setChatMessages = jest.fn(messages => {
    state.chatMessages = messages;
  });
  state.setChatHistoryMeta = jest.fn((channel, meta) => {
    state.chatHistoryMeta[channel] = meta;
  });
  state.mergeChatMessages = jest.fn(messages => {
    state.chatMessages = [...state.chatMessages, ...messages];
  });
  state.replaceChannelMessages = jest.fn((channel, messages) => {
    state.chatMessages = state.chatMessages
      .filter(msg => msg.channel !== channel)
      .concat(messages);
  });
  state.setNotice = jest.fn();
  state.setRoles = jest.fn(roles => {
    state.roles = roles;
  });
  state.setSessionUserId = jest.fn(userId => {
    state.sessionUserId = userId;
  });
  state.setOtherVessels = jest.fn(vessels => {
    state.otherVessels = vessels;
  });
  state.updateVessel = jest.fn(partial => {
    state.vessel = Object.assign(
      {},
      state.vessel,
      partial,
    ) as SimulationState['vessel'];
  });
  state.setCrew = jest.fn(({ ids, names }) => {
    if (ids) {
      state.crewIds = ids;
    }
    if (names) {
      state.crewNames = names;
    }
  });
  state.updateEnvironment = jest.fn(environment => {
    state.environment = Object.assign(
      {},
      state.environment,
      environment,
    ) as SimulationState['environment'];
  });
  state.setAccount = jest.fn(account => {
    state.account = { ...state.account, ...account };
  });
  state.upsertMissionAssignment = jest.fn();
  state.addChatMessage = jest.fn(message => {
    state.chatMessages = [...state.chatMessages, message];
  });
  state.addEvent = jest.fn();
  state.setSeamarks = jest.fn(next => {
    state.seamarks = { ...state.seamarks, ...next };
  });
  state.setSocketLatencyMs = jest.fn();
  state.setSpaceInfo = jest.fn();
  state.updateMachineryStatus = jest.fn();
  state.setMissionAssignments = jest.fn();
  state.setMissions = jest.fn();

  return state;
};

export const setupSocketManager = (
  overrides: Partial<SimulationState> = {},
) => {
  const storeState = createStoreState(overrides);
  const handlers: Record<string, SocketHandler> = {};
  const socket: MockSocket = {
    connected: true,
    auth: {},
    on: jest.fn((event: string, cb: SocketHandler) => {
      handlers[event] = cb;
      return socket;
    }),
    emit: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
  };

  const ioMock = jest.fn<
    MockSocket,
    [string, { auth: Record<string, unknown> }?]
  >(() => socket);

  const socketManager = createSocketManager({
    ioClient: ioMock as unknown as typeof socketIoClient,
    storeAdapter: {
      getState: () => storeState,
    },
  });

  return {
    socketManager,
    socket,
    handlers,
    storeState,
    ioMock,
  };
};
