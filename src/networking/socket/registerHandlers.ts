import type * as GeoJSON from 'geojson';
import type { AccountState } from '../../store';
import type { SocketStoreState } from '../adapters/socketStoreAdapter';
import type { EnvironmentState } from '../../types/environment.types';
import type { MissionAssignmentData } from '../../types/mission.types';
import type {
  ChatHistoryResponse,
  ChatMessageData,
  SimulationUpdateData,
  VesselJoinedData,
  VesselLeftData,
  VesselTeleportData,
} from '../../types/socket.types';
import {
  STORAGE_SPACE_KEY,
  STORAGE_SPACE_SELECTED_KEY,
} from '../../features/sim/constants';
import {
  normalizeChatHistoryPayload,
  normalizeChatMessage,
} from './chatProjection';
import type { ClientSocket } from './types';

type RegisterHandlersParams = {
  socket: ClientSocket;
  requestChatHistory: (channel: string) => void;
  startLatencySampling: () => void;
  stopLatencySampling: () => void;
  startResyncWatcher: () => void;
  stopResyncWatcher: () => void;
  notifyModeChange: (mode: 'player' | 'spectator') => void;
  getInitialMode: () => 'player' | 'spectator';
  shouldAutoJoin: () => boolean;
  resolveConnectionWaiters: () => void;
  attemptReconnect: () => void;
  handleSimulationUpdate: (data: SimulationUpdateData) => void;
  handleVesselTeleport: (data: VesselTeleportData) => void;
  handleEnvironmentUpdate: (data: EnvironmentState) => void;
  getStoreState: () => SocketStoreState;
  setJoinPreference: (mode: 'player' | 'spectator', autoJoin?: boolean) => void;
  switchSpace: (spaceId: string) => void;
  clearChatHistoryLoading: (channel: string) => void;
  setConnectionStatus: (connected: boolean) => void;
};

export const registerSocketHandlers = ({
  socket,
  requestChatHistory,
  startLatencySampling,
  stopLatencySampling,
  startResyncWatcher,
  stopResyncWatcher,
  notifyModeChange,
  getInitialMode,
  shouldAutoJoin,
  resolveConnectionWaiters,
  attemptReconnect,
  handleSimulationUpdate,
  handleVesselTeleport,
  handleEnvironmentUpdate,
  getStoreState,
  setJoinPreference,
  switchSpace,
  clearChatHistoryLoading,
  setConnectionStatus,
}: RegisterHandlersParams): void => {
  socket.on('connect', () => {
    console.info('Socket.IO connection established');
    requestChatHistory('global');
    startLatencySampling();
    startResyncWatcher();
    if (getInitialMode() === 'player' && shouldAutoJoin()) {
      notifyModeChange('player');
    }
    setConnectionStatus(true);
    resolveConnectionWaiters();
  });

  socket.on('disconnect', (reason: string) => {
    console.info(`Socket.IO disconnected: ${reason}`);
    stopLatencySampling();
    stopResyncWatcher();
    setConnectionStatus(false);
    if (reason === 'io server disconnect') {
      attemptReconnect();
    }
  });

  socket.on('connect_error', (error: Error) => {
    console.error('Socket.IO connection error:', error);
    setConnectionStatus(false);
    attemptReconnect();
  });

  socket.on('simulation:update', handleSimulationUpdate);
  socket.on('vessel:teleport', handleVesselTeleport);

  socket.on('vessel:joined', (data: VesselJoinedData) => {
    console.info(`New vessel joined: ${data.username} (${data.userId})`);
  });

  socket.on('vessel:left', (data: VesselLeftData) => {
    console.info(`Vessel left: ${data.userId}`);
  });

  socket.on('environment:update', handleEnvironmentUpdate);

  socket.on('latency:pong', (data: { sentAt: number }) => {
    if (!data || typeof data.sentAt !== 'number') return;
    const rtt = Date.now() - data.sentAt;
    getStoreState().setSocketLatencyMs(rtt);
  });

  socket.on('mission:update', (data: MissionAssignmentData) => {
    if (data) {
      getStoreState().upsertMissionAssignment(data);
    }
  });

  socket.on('economy:update', (data: AccountState) => {
    if (data) {
      getStoreState().setAccount(data);
    }
  });

  socket.on('chat:message', (data: ChatMessageData) => {
    const normalized = normalizeChatMessage(data, data.channel || 'global');
    getStoreState().addChatMessage(normalized);
    if (data.userId === 'system') {
      getStoreState().addEvent({
        category: 'system',
        type: 'notification',
        message: `${data.username}: ${data.message}`,
        severity: 'info',
      });
    }
  });

  socket.on('chat:history', (data: ChatHistoryResponse) => {
    const store = getStoreState();
    const normalized = normalizeChatHistoryPayload(data);
    if (normalized.reset) {
      if (normalized.messages.length > 0) {
        store.replaceChannelMessages(normalized.channel, normalized.messages);
      } else {
        store.setChatHistoryMeta(normalized.channel, {
          hasMore: normalized.hasMore ?? false,
          loaded: true,
        });
      }
    } else if (normalized.messages.length > 0) {
      store.mergeChatMessages(normalized.messages);
    }

    if (normalized.hasMore !== undefined) {
      store.setChatHistoryMeta(normalized.channel, {
        hasMore: normalized.hasMore,
        loaded: true,
      });
    }
    clearChatHistoryLoading(normalized.channel);
  });

  socket.on('error', (error: unknown) => {
    console.error('Socket.IO error:', error);
    const store = getStoreState();
    const message =
      typeof error === 'string'
        ? error
        : error instanceof Error
          ? error.message
          : 'Connection error';
    const lowered = message.toLowerCase();
    if (lowered.includes('signed in elsewhere')) {
      store.setMode('spectator');
      store.setCurrentVesselId(null);
      setJoinPreference('spectator', false);
    }
    if (lowered.includes('authentication expired')) {
      store.setMode('spectator');
      store.setCurrentVesselId(null);
      setJoinPreference('spectator', false);
    }
    const spaceMatch = message.match(/Vessel is in space\s+([A-Za-z0-9_-]+)/i);
    if (spaceMatch) {
      const targetSpace = spaceMatch[1]?.trim().toLowerCase();
      if (targetSpace && targetSpace !== store.spaceId) {
        store.setSpaceId(targetSpace);
        store.setChatMessages([]);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(STORAGE_SPACE_KEY, targetSpace);
          window.localStorage.setItem(STORAGE_SPACE_SELECTED_KEY, 'true');
        }
        switchSpace(targetSpace);
      }
    }
    store.setNotice({ type: 'error', message });
  });

  socket.on(
    'seamarks:data',
    (data: {
      features: GeoJSON.Feature[];
      type: string;
      meta: {
        lat: number;
        lon: number;
        radiusMeters: number;
        bbox: { south: number; west: number; north: number; east: number };
      };
    }) => {
      console.info('Received seamarks data from server', data);
      const fc = data?.features ?? data;
      const meta = data?.meta ?? {};
      const q = (n: number) => n.toFixed(5);
      const bboxKey = meta.bbox
        ? `${q(meta.bbox.south)}:${q(meta.bbox.west)}:${q(meta.bbox.north)}:${q(meta.bbox.east)}`
        : null;
      const store = getStoreState();
      store.setSeamarks({
        features: fc,
        bboxKey,
        center: { lat: meta.lat, lon: meta.lon },
        radiusMeters: meta.radiusMeters ?? store.seamarks.radiusMeters,
        updatedAt: Date.now(),
      });
    },
  );
};
