import io from 'socket.io-client';
import type * as SocketIOClient from 'socket.io-client';
import * as GeoJSON from 'geojson';
import useStore, { AccountState } from '../store';
import { SimpleVesselState } from '../types/vessel.types';
import { EnvironmentState } from '../types/environment.types';
import { ensurePosition, positionToLatLon } from '../lib/position';
import {
  ChatHistoryResponse,
  ChatMessageData,
  SimulationUpdateData,
  VesselTeleportData,
  VesselControlData,
  VesselJoinedData,
  VesselLeftData,
  VesselUpdateData,
} from '../types/socket.types';
import { MissionAssignmentData } from '../types/mission.types';
import {
  STORAGE_SPACE_KEY,
  STORAGE_SPACE_SELECTED_KEY,
} from '../features/sim/constants';

const CHAT_HISTORY_PAGE_SIZE = 20;
const RESYNC_POLL_MS = 2000;
const RESYNC_STALE_MS = 8000;

type ClientSocket = ReturnType<typeof io> & {
  auth?: {
    token?: string | null;
    userId?: string | null;
    username?: string | null;
    spaceId?: string | null;
    mode?: 'player' | 'spectator';
    autoJoin?: boolean;
  };
};

type ClientConnectOpts = Partial<SocketIOClient.ConnectOpts> & {
  withCredentials?: boolean;
  auth?: {
    userId?: string | null;
    username?: string | null;
    token?: string | null;
    spaceId?: string | null;
    mode?: 'player' | 'spectator';
    autoJoin?: boolean;
  };
};

const hasVesselChanged = (
  prev: SimpleVesselState | undefined,
  next: SimpleVesselState,
): boolean => {
  if (!prev) return true;

  const stationsEqual = (
    a?: SimpleVesselState['stations'],
    b?: SimpleVesselState['stations'],
  ) => {
    const keys = ['helm', 'engine', 'radio'] as const;
    return keys.every(key => {
      const aStation = a?.[key];
      const bStation = b?.[key];
      return (
        (aStation?.userId || null) === (bStation?.userId || null) &&
        (aStation?.username || null) === (bStation?.username || null)
      );
    });
  };

  const posChanged =
    prev.position.lat !== next.position.lat ||
    prev.position.lon !== next.position.lon ||
    prev.position.z !== next.position.z ||
    prev.position.x !== next.position.x ||
    prev.position.y !== next.position.y;
  const orientationChanged =
    prev.orientation.heading !== next.orientation.heading ||
    prev.orientation.roll !== next.orientation.roll ||
    prev.orientation.pitch !== next.orientation.pitch;
  const velocityChanged =
    prev.velocity.surge !== next.velocity.surge ||
    prev.velocity.sway !== next.velocity.sway ||
    prev.velocity.heave !== next.velocity.heave;
  const controlsChanged =
    (prev.controls?.throttle ?? 0) !== (next.controls?.throttle ?? 0) ||
    (prev.controls?.rudderAngle ?? 0) !== (next.controls?.rudderAngle ?? 0);
  const helmChanged =
    prev.helm?.userId !== next.helm?.userId ||
    prev.helm?.username !== next.helm?.username;
  const stationsChanged = !stationsEqual(prev.stations, next.stations);
  const failureChanged =
    (prev.failureState?.engineFailure ?? false) !==
      (next.failureState?.engineFailure ?? false) ||
    (prev.failureState?.steeringFailure ?? false) !==
      (next.failureState?.steeringFailure ?? false) ||
    (prev.failureState?.floodingLevel ?? 0) !==
      (next.failureState?.floodingLevel ?? 0);
  const damageChanged =
    (prev.damageState?.hullIntegrity ?? 1) !==
      (next.damageState?.hullIntegrity ?? 1) ||
    (prev.damageState?.engineHealth ?? 1) !==
      (next.damageState?.engineHealth ?? 1) ||
    (prev.damageState?.steeringHealth ?? 1) !==
      (next.damageState?.steeringHealth ?? 1) ||
    (prev.damageState?.electricalHealth ?? 1) !==
      (next.damageState?.electricalHealth ?? 1) ||
    (prev.damageState?.floodingDamage ?? 0) !==
      (next.damageState?.floodingDamage ?? 0);

  return (
    prev.id !== next.id ||
    prev.ownerId !== next.ownerId ||
    posChanged ||
    orientationChanged ||
    velocityChanged ||
    controlsChanged ||
    helmChanged ||
    stationsChanged ||
    failureChanged ||
    damageChanged
  );
};

// Socket.IO Client Manager
class SocketManager {
  private socket: ClientSocket | null = null;
  private userId: string;
  private username: string = 'Anonymous';
  private reconnectTimer: NodeJS.Timeout | null = null;
  private connectionAttempts = 0;
  private maxReconnectAttempts = 5;
  private authToken: string | null = null;
  private lastUrl: string = 'http://localhost:3001';
  private spaceId: string = 'global';
  private initialMode: 'player' | 'spectator' = 'player';
  private autoJoin: boolean = true;
  private hasHydratedSelf = false;
  private lastSelfSnapshot: SimpleVesselState | null = null;
  private selfHydrateResolvers: Array<(vessel: SimpleVesselState) => void> = [];
  private lastSelfVesselId: string | null = null;
  private chatHistoryLoading: Set<string> = new Set();
  private latencyTimer: NodeJS.Timeout | null = null;
  private connectResolvers: Array<() => void> = [];
  private resyncTimer: NodeJS.Timeout | null = null;
  private lastSimulationTimestamp = 0;
  private lastSimulationUpdateAt = 0;
  private lastControlSent: {
    throttle?: number;
    rudderAngle?: number;
    ballast?: number;
    timestamp: number;
  } = { timestamp: 0 };

  constructor() {
    this.userId = this.generateUserId();
  }

  // Connect to Socket.IO server
  connect(url: string = 'http://localhost:3001'): void {
    if (this.socket?.connected) {
      return; // Already connected or in progress
    }
    this.lastUrl = url;

    if (this.socket) {
      // Clean up any old instance before reconnecting
      this.disconnect();
    }

    console.info(`Connecting to Socket.IO server at ${url}`);

    // Reset hydration marker on new connection
    this.hasHydratedSelf = false;
    this.lastSelfSnapshot = null;
    this.selfHydrateResolvers = [];
    this.lastSelfVesselId = null;
    this.lastSimulationTimestamp = 0;
    this.lastSimulationUpdateAt = Date.now();
    useStore.getState().setCurrentVesselId(null);

    const options: ClientConnectOpts = {
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      withCredentials: true,
      auth: {
        userId: this.userId,
        username: this.username,
        token: this.authToken || undefined,
        spaceId: this.spaceId,
        mode: this.initialMode,
        autoJoin: this.autoJoin,
      },
    };

    this.socket = io(url, options) as ClientSocket;

    // Set up event listeners
    this.setupEventListeners();
  }

  switchSpace(spaceId: string): void {
    this.setSpaceId(spaceId);
    this.lastSimulationTimestamp = 0;
    this.lastSimulationUpdateAt = Date.now();
    const url = this.lastUrl || 'http://localhost:3001';
    this.disconnect();
    this.connect(url);
  }

  // Setup Socket.IO event listeners
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.info('Socket.IO connection established');
      this.connectionAttempts = 0;
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      this.requestChatHistory('global');
      this.startLatencySampling();
      this.startResyncWatcher();
      if (this.initialMode === 'player' && this.autoJoin) {
        this.notifyModeChange('player');
      }
      const resolvers = this.connectResolvers.splice(0);
      resolvers.forEach(resolve => resolve());
    });

    this.socket.on('disconnect', (reason: string) => {
      console.info(`Socket.IO disconnected: ${reason}`);
      this.stopLatencySampling();
      this.stopResyncWatcher();

      // Handle reconnection for certain disconnect reasons
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, manual reconnect needed
        this.attemptReconnect();
      }
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('Socket.IO connection error:', error);
      this.attemptReconnect();
    });

    // Simulation events
    this.socket.on('simulation:update', (data: SimulationUpdateData) => {
      this.handleSimulationUpdate(data);
    });

    this.socket.on('vessel:teleport', (data: VesselTeleportData) => {
      this.handleVesselTeleport(data);
    });

    this.socket.on('vessel:joined', (data: VesselJoinedData) => {
      console.info(`New vessel joined: ${data.username} (${data.userId})`);
      // Handle new vessel joining
    });

    this.socket.on('vessel:left', (data: VesselLeftData) => {
      console.info(`Vessel left: ${data.userId}`);
      // Handle vessel leaving
    });

    this.socket.on('environment:update', (data: EnvironmentState) => {
      this.handleEnvironmentUpdate(data);
    });

    this.socket.on('latency:pong', (data: { sentAt: number }) => {
      if (!data || typeof data.sentAt !== 'number') return;
      const rtt = Date.now() - data.sentAt;
      useStore.getState().setSocketLatencyMs(rtt);
    });

    this.socket.on('mission:update', (data: MissionAssignmentData) => {
      const store = useStore.getState();
      if (data) {
        store.upsertMissionAssignment(data);
      }
    });

    this.socket.on('economy:update', (data: AccountState) => {
      const store = useStore.getState();
      if (data) {
        store.setAccount(data);
      }
    });

    this.socket.on('chat:message', (data: ChatMessageData) => {
      useStore.getState().addChatMessage({
        id: data.id,
        userId: data.userId,
        username: data.username,
        message: data.message,
        timestamp: data.timestamp || Date.now(),
        channel: data.channel || 'global',
      });
      if (data.userId === 'system') {
        useStore.getState().addEvent({
          category: 'system',
          type: 'notification',
          message: `${data.username}: ${data.message}`,
          severity: 'info',
        });
      }
    });

    this.socket.on('chat:history', (data: ChatHistoryResponse) => {
      const channel = data?.channel || 'global';
      const normalizedChannel =
        channel && channel.startsWith('vessel:')
          ? `vessel:${channel.split(':')[1]?.split('_')[0] || ''}`
          : channel;
      const messages: ChatMessageData[] = Array.isArray(data?.messages)
        ? data.messages
        : [];
      const store = useStore.getState();
      const normalizedMessages = messages.map((msg: ChatMessageData) => ({
        id: msg.id,
        userId: msg.userId,
        username: msg.username,
        message: msg.message,
        timestamp: msg.timestamp || Date.now(),
        channel: msg.channel || normalizedChannel,
      }));
      if (data?.reset) {
        if (normalizedMessages.length > 0) {
          store.replaceChannelMessages(normalizedChannel, normalizedMessages);
        } else {
          // If the server returned no messages on reset, keep existing ones but mark loaded.
          store.setChatHistoryMeta(normalizedChannel, {
            hasMore: data?.hasMore ?? false,
            loaded: true,
          });
        }
      } else if (normalizedMessages.length > 0) {
        store.mergeChatMessages(normalizedMessages);
      }
      if (data?.hasMore !== undefined) {
        store.setChatHistoryMeta(normalizedChannel, {
          hasMore: data.hasMore,
          loaded: true,
        });
      }
      this.chatHistoryLoading.delete(normalizedChannel);
    });

    this.socket.on('error', (error: unknown) => {
      console.error('Socket.IO error:', error);
      const store = useStore.getState();
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
        this.setJoinPreference('spectator', false);
      }
      if (lowered.includes('authentication expired')) {
        store.setMode('spectator');
        store.setCurrentVesselId(null);
        this.setJoinPreference('spectator', false);
      }
      const spaceMatch = message.match(
        /Vessel is in space\s+([A-Za-z0-9_-]+)/i,
      );
      if (spaceMatch) {
        const targetSpace = spaceMatch[1]?.trim().toLowerCase();
        if (targetSpace && targetSpace !== store.spaceId) {
          store.setSpaceId(targetSpace);
          store.setChatMessages([]);
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(STORAGE_SPACE_KEY, targetSpace);
            window.localStorage.setItem(STORAGE_SPACE_SELECTED_KEY, 'true');
          }
          this.switchSpace(targetSpace);
        }
      }
      store.setNotice({ type: 'error', message });
    });

    this.socket.on(
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
        // expected: { featureCollection, meta: { bboxKey, center, radiusMeters, ... } }
        const fc = data?.features ?? data; // depending on your server payload
        const meta = data?.meta ?? {};
        const q = (n: number) => n.toFixed(5);
        const bboxKey = meta.bbox
          ? `${q(meta.bbox.south)}:${q(meta.bbox.west)}:${q(meta.bbox.north)}:${q(meta.bbox.east)}`
          : null;
        useStore.getState().setSeamarks({
          features: fc,
          bboxKey,
          center: { lat: meta.lat, lon: meta.lon },
          radiusMeters:
            meta.radiusMeters ?? useStore.getState().seamarks.radiusMeters,
          updatedAt: Date.now(),
        });
      },
    );
  }

  private startLatencySampling(): void {
    if (!this.socket || this.latencyTimer) return;
    this.latencyTimer = setInterval(() => {
      if (!this.socket?.connected) return;
      this.socket.emit('latency:ping', { sentAt: Date.now() });
    }, 5000);
  }

  private stopLatencySampling(): void {
    if (this.latencyTimer) {
      clearInterval(this.latencyTimer);
      this.latencyTimer = null;
    }
  }

  private startResyncWatcher(): void {
    if (this.resyncTimer) return;
    this.lastSimulationUpdateAt = Date.now();
    this.resyncTimer = setInterval(() => {
      if (!this.socket?.connected) return;
      const now = Date.now();
      if (now - this.lastSimulationUpdateAt < RESYNC_STALE_MS) return;
      this.lastSimulationUpdateAt = now;
      this.socket.emit('simulation:resync', { reason: 'stale' });
    }, RESYNC_POLL_MS);
  }

  private stopResyncWatcher(): void {
    if (this.resyncTimer) {
      clearInterval(this.resyncTimer);
      this.resyncTimer = null;
    }
  }

  // Handle simulation updates from server
  private handleSimulationUpdate(data: SimulationUpdateData): void {
    const store = useStore.getState();
    if (typeof data.timestamp === 'number') {
      if (data.timestamp < this.lastSimulationTimestamp) {
        return;
      }
      this.lastSimulationTimestamp = data.timestamp;
    }
    this.lastSimulationUpdateAt = Date.now();
    const previousSpaceId = store.spaceId;
    if (data.self?.roles) {
      store.setRoles(data.self.roles);
    }
    if (data.self?.userId && store.sessionUserId !== data.self.userId) {
      store.setSessionUserId(data.self.userId);
    }
    if (data.self) {
      const nextAccount: Record<string, number> = {};
      if (typeof data.self.rank === 'number') {
        nextAccount.rank = data.self.rank;
      }
      if (typeof data.self.credits === 'number') {
        nextAccount.credits = data.self.credits;
      }
      if (typeof data.self.experience === 'number') {
        nextAccount.experience = data.self.experience;
      }
      if (typeof data.self.safetyScore === 'number') {
        nextAccount.safetyScore = data.self.safetyScore;
      }
      if (Object.keys(nextAccount).length > 0) {
        store.setAccount(nextAccount);
      }
    }
    if (data.self?.mode) {
      store.setMode(data.self.mode);
      if (data.self.mode === 'spectator') {
        this.lastSelfVesselId = null;
      }
    }
    if (data.self?.spaceId) {
      store.setSpaceId(data.self.spaceId);
      this.setSpaceId(data.self.spaceId);
    } else if (data.spaceId) {
      store.setSpaceId(data.spaceId);
      this.setSpaceId(data.spaceId);
    }
    if (store.spaceId !== previousSpaceId) {
      this.lastSimulationTimestamp = 0;
      this.lastSimulationUpdateAt = Date.now();
    }
    if (data.spaceInfo) {
      store.setSpaceInfo(data.spaceInfo);
    }
    if (data.environment) {
      store.updateEnvironment(data.environment);
    }
    if (data.chatHistory) {
      store.setChatMessages(
        data.chatHistory.map(msg => ({
          userId: msg.userId,
          username: msg.username,
          message: msg.message,
          timestamp: msg.timestamp || Date.now(),
          channel: msg.channel || 'global',
        })),
      );
      const perChannel = new Map<string, number>();
      data.chatHistory.forEach(msg => {
        const channel = msg.channel || 'global';
        perChannel.set(channel, (perChannel.get(channel) || 0) + 1);
      });
      perChannel.forEach((count, channel) => {
        store.setChatHistoryMeta(channel, {
          hasMore: count >= CHAT_HISTORY_PAGE_SIZE,
          loaded: true,
        });
      });
    }
    const currentOthers = store.otherVessels || {};
    const nextOthers = data.partial ? { ...currentOthers } : {};
    let changed = false;
    let foundSelf = false;
    const selfUserId = data.self?.userId || this.userId;
    let preferredSelfId = data.self?.vesselId;
    if (preferredSelfId && !data.vessels[preferredSelfId]) {
      const normalizedMatch = Object.keys(data.vessels).find(
        id => id.split('_')[0] === preferredSelfId,
      );
      preferredSelfId = normalizedMatch;
    }
    if (!preferredSelfId) {
      preferredSelfId = Object.entries(data.vessels).find(([, vessel]) =>
        Array.isArray(vessel.crewIds)
          ? vessel.crewIds.includes(selfUserId)
          : false,
      )?.[0];
    }
    if (!preferredSelfId) {
      const currentId = store.currentVesselId;
      if (currentId && data.vessels[currentId]) {
        preferredSelfId = currentId;
      }
    }
    if (!preferredSelfId) {
      const ownerMatches = Object.entries(data.vessels).filter(
        ([, vessel]) => vessel.ownerId === selfUserId,
      );
      if (ownerMatches.length === 1) {
        preferredSelfId = ownerMatches[0][0];
      }
    }

    Object.entries(data.vessels).forEach(([id, vesselData]) => {
      const normalized = {
        ...vesselData,
        position: ensurePosition(vesselData.position),
      };
      const isSelf =
        (preferredSelfId ? id === preferredSelfId : false) ||
        id === this.userId ||
        id === store.currentVesselId ||
        normalized.ownerId === selfUserId ||
        (Array.isArray(normalized.crewIds) &&
          normalized.crewIds.includes(selfUserId));
      if (isSelf) {
        foundSelf = true;
        const prevFailure = store.vessel.failureState;
        const prevDamage = store.vessel.damageState;
        if (store.currentVesselId !== id) {
          store.setCurrentVesselId(id);
        }
        if (!this.hasHydratedSelf) {
          this.hasHydratedSelf = true;
          store.setCurrentVesselId(id);
          this.lastSelfSnapshot = normalized;
          this.selfHydrateResolvers.forEach(resolve => resolve(normalized));
          this.selfHydrateResolvers = [];
        }
        if (normalized.crewIds || normalized.crewNames) {
          store.setCrew({
            ids: normalized.crewIds,
            names: normalized.crewNames,
          });
        }
        const existingPhysics = store.vessel.physics;
        const incomingPhysics = normalized.physics;
        const mergedPhysics = incomingPhysics
          ? {
              ...existingPhysics,
              ...incomingPhysics,
              params: incomingPhysics.params
                ? {
                    ...(existingPhysics?.params || {}),
                    ...incomingPhysics.params,
                  }
                : existingPhysics?.params,
            }
          : existingPhysics;
        store.updateVessel({
          position: normalized.position,
          orientation: normalized.orientation,
          velocity: normalized.velocity,
          angularVelocity: normalized.angularVelocity
            ? {
                ...store.vessel.angularVelocity,
                ...normalized.angularVelocity,
              }
            : undefined,
          waterDepth: normalized.waterDepth,
          failureState: normalized.failureState ?? store.vessel.failureState,
          damageState: normalized.damageState ?? store.vessel.damageState,
          properties: normalized.properties,
          hydrodynamics: normalized.hydrodynamics,
          physics: mergedPhysics,
          render: normalized.render,
          controls: normalized.controls
            ? {
                ...store.vessel.controls,
                throttle:
                  normalized.controls.throttle ??
                  store.vessel.controls?.throttle ??
                  0,
                rudderAngle:
                  normalized.controls.rudderAngle ??
                  store.vessel.controls?.rudderAngle ??
                  0,
                ballast:
                  normalized.controls.ballast ??
                  store.vessel.controls?.ballast ??
                  0.5,
                bowThruster:
                  normalized.controls.bowThruster ??
                  store.vessel.controls?.bowThruster ??
                  0,
              }
            : store.vessel.controls,
          helm: normalized.helm,
          stations: normalized.stations,
        });
        if (
          store.mode === 'player' &&
          (normalized.desiredMode ?? normalized.mode) !== 'ai' &&
          this.lastSelfVesselId !== id
        ) {
          this.lastSelfVesselId = id;
          const pos = normalized.position;
          if (Number.isFinite(pos.x) && Number.isFinite(pos.y)) {
            void import('../simulation')
              .then(({ getSimulationLoop }) => {
                getSimulationLoop().syncVesselFromStore();
              })
              .catch(error => {
                console.error('Failed to sync vessel from store:', error);
              });
          }
        }
        if (normalized.failureState) {
          store.updateMachineryStatus({
            failures: {
              engineFailure: normalized.failureState.engineFailure,
              rudderFailure: normalized.failureState.steeringFailure,
              pumpFailure: normalized.failureState.floodingLevel > 0.2,
            },
          });
          const changed =
            (prevFailure?.engineFailure ?? false) !==
              normalized.failureState.engineFailure ||
            (prevFailure?.steeringFailure ?? false) !==
              normalized.failureState.steeringFailure ||
            (prevFailure?.floodingLevel ?? 0) !==
              normalized.failureState.floodingLevel;
          if (changed) {
            if (
              normalized.failureState.engineFailure &&
              !(prevFailure?.engineFailure ?? false)
            ) {
              store.addEvent({
                category: 'alarm',
                type: 'engine_failure',
                message: 'Engine failure detected',
                severity: 'critical',
              });
            }
            if (
              normalized.failureState.steeringFailure &&
              !(prevFailure?.steeringFailure ?? false)
            ) {
              store.addEvent({
                category: 'alarm',
                type: 'steering_failure',
                message: 'Steering failure detected',
                severity: 'critical',
              });
            }
            if (
              normalized.failureState.floodingLevel > 0.2 &&
              (prevFailure?.floodingLevel ?? 0) <= 0.2
            ) {
              store.addEvent({
                category: 'alarm',
                type: 'flooding',
                message: 'Flooding detected',
                severity: 'critical',
              });
            }
          }
        }
        if (normalized.damageState) {
          store.updateMachineryStatus({
            engineHealth: normalized.damageState.engineHealth,
            steeringSystemHealth: normalized.damageState.steeringHealth,
            electricalSystemHealth: normalized.damageState.electricalHealth,
          });
          const damageChanged =
            (prevDamage?.hullIntegrity ?? 1) !==
              normalized.damageState.hullIntegrity ||
            (prevDamage?.engineHealth ?? 1) !==
              normalized.damageState.engineHealth ||
            (prevDamage?.steeringHealth ?? 1) !==
              normalized.damageState.steeringHealth ||
            (prevDamage?.electricalHealth ?? 1) !==
              normalized.damageState.electricalHealth ||
            (prevDamage?.floodingDamage ?? 0) !==
              normalized.damageState.floodingDamage;
          if (damageChanged && normalized.damageState.hullIntegrity < 0.4) {
            store.addEvent({
              category: 'alarm',
              type: 'damage',
              message: 'Hull integrity critical',
              severity: 'critical',
            });
          }
        }
        const desired = normalized.desiredMode || normalized.mode;
        if (desired === 'ai') {
          store.setMode('spectator');
          this.lastSelfVesselId = null;
        }
        return;
      }

      const prev = nextOthers[id];
      if (hasVesselChanged(prev, normalized)) {
        nextOthers[id] = normalized;
        changed = true;
        if (
          id === store.currentVesselId &&
          (normalized.crewIds ||
            normalized.crewNames ||
            normalized.helm ||
            normalized.stations)
        ) {
          store.setCrew({
            ids: normalized.crewIds,
            names: normalized.crewNames,
          });
          if (normalized.helm) {
            store.updateVessel({ helm: normalized.helm });
          }
          if (normalized.stations) {
            store.updateVessel({ stations: normalized.stations });
          }
        }
      }
    });

    if (!data.partial) {
      const removed =
        Object.keys(currentOthers).length !== Object.keys(nextOthers).length ||
        Object.keys(currentOthers).some(id => !(id in nextOthers));
      changed = changed || removed;
    }

    if (changed || !data.partial) {
      store.setOtherVessels(nextOthers);
    }

    if (!foundSelf && !this.hasHydratedSelf && data.self) {
      const fallback: SimpleVesselState = {
        id: this.userId,
        position: store.vessel.position,
        orientation: store.vessel.orientation,
        velocity: store.vessel.velocity,
        controls: store.vessel.controls,
      };
      this.hasHydratedSelf = true;
      this.lastSelfSnapshot = fallback;
      this.selfHydrateResolvers.forEach(resolve => resolve(fallback));
      this.selfHydrateResolvers = [];
    }
  }

  private handleVesselTeleport(data: VesselTeleportData): void {
    if (!data?.vesselId || !data.position) return;
    const store = useStore.getState();
    const currentId = store.currentVesselId;
    if (!currentId) return;
    const normalized = data.vesselId.split('_')[0];
    const normalizedCurrent = currentId.split('_')[0];
    if (normalized !== normalizedCurrent) return;
    void import('../simulation')
      .then(({ getSimulationLoop }) => {
        const normalized = ensurePosition(data.position);
        getSimulationLoop().teleportVessel({
          x: normalized.x ?? 0,
          y: normalized.y ?? 0,
          z: normalized.z,
        });
      })
      .catch(error => {
        console.error('Failed to teleport vessel:', error);
      });
  }

  // Await the first self snapshot after connect; resolves immediately if already hydrated
  waitForSelfSnapshot(): Promise<SimpleVesselState> {
    if (this.lastSelfSnapshot) return Promise.resolve(this.lastSelfSnapshot);
    return new Promise(resolve => {
      this.selfHydrateResolvers.push(resolve);
    });
  }

  // Handle environment updates from server
  private handleEnvironmentUpdate(data: EnvironmentState): void {
    const store = useStore.getState();
    store.updateEnvironment(data);
  }

  // Send vessel state update to server
  sendVesselUpdate(): void {
    if (!this.socket?.connected) return;

    const { vessel } = useStore.getState();

    const updateData: VesselUpdateData = {
      userId: this.userId,
      position: vessel.position,
      orientation: vessel.orientation,
      velocity: vessel.velocity,
      angularVelocity: vessel.angularVelocity,
    };

    this.socket.emit('vessel:update', updateData);
  }

  // Send vessel control update to server
  sendControlUpdate(
    throttle?: number,
    rudderAngle?: number,
    ballast?: number,
  ): void {
    if (!this.socket?.connected) return;
    if (
      throttle === undefined &&
      rudderAngle === undefined &&
      ballast === undefined
    ) {
      console.info('No control changes to send');
      return;
    }

    const last = this.lastControlSent;
    const epsilon = 0.0005;
    const hasThrottleChange =
      throttle !== undefined &&
      Math.abs(throttle - (last.throttle ?? 0)) > epsilon;
    const hasRudderChange =
      rudderAngle !== undefined &&
      Math.abs(rudderAngle - (last.rudderAngle ?? 0)) > epsilon;
    const hasBallastChange =
      ballast !== undefined &&
      Math.abs(ballast - (last.ballast ?? 0)) > epsilon;
    if (!hasThrottleChange && !hasRudderChange && !hasBallastChange) {
      return;
    }

    const controlData: VesselControlData = {
      userId: this.userId,
      throttle,
      rudderAngle,
      ballast,
    };

    console.info(
      `Sending control update: ${JSON.stringify(controlData, null, 2)}`,
    );
    this.socket.emit('vessel:control', controlData);
    this.lastControlSent = {
      throttle: hasThrottleChange ? throttle : last.throttle,
      rudderAngle: hasRudderChange ? rudderAngle : last.rudderAngle,
      ballast: hasBallastChange ? ballast : last.ballast,
      timestamp: performance.now(),
    };

    console.info('Control update sent successfully');
  }

  requestNewVessel(position?: {
    x?: number;
    y?: number;
    lat?: number;
    lon?: number;
  }): void {
    if (!this.socket?.connected) return;
    let payload = position;
    if (
      position &&
      (position.x !== undefined || position.y !== undefined) &&
      (position.lat === undefined || position.lon === undefined)
    ) {
      const ll = positionToLatLon({
        x: position.x ?? 0,
        y: position.y ?? 0,
      });
      payload = {
        ...position,
        lat: position.lat ?? ll.lat,
        lon: position.lon ?? ll.lon,
      };
    }
    this.socket.emit('vessel:create', payload);
  }

  requestJoinVessel(vesselId?: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('vessel:join', vesselId ? { vesselId } : undefined);
  }

  requestHelm(action: 'claim' | 'release'): void {
    if (!this.socket?.connected) return;
    this.socket.emit('vessel:helm', { action });
  }

  requestStation(
    station: 'helm' | 'engine' | 'radio',
    action: 'claim' | 'release',
  ): void {
    if (!this.socket?.connected) return;
    this.socket.emit('vessel:station', { station, action });
  }

  requestRepair(vesselId?: string): void {
    if (!this.socket?.connected) return;
    const store = useStore.getState();
    this.socket.emit(
      'vessel:repair',
      { vesselId },
      (res?: { ok: boolean; message?: string }) => {
        if (res?.ok) {
          store.setNotice({ message: res.message || 'Repairs complete' });
        } else if (res?.message) {
          store.setNotice({ message: res.message, kind: 'error' });
        }
      },
    );
  }

  sendChatMessage(message: string, channel = 'global'): void {
    if (!this.socket?.connected) return;
    const targetChannel = this.buildSpaceChannel(channel);
    this.socket.emit('chat:message', { message, channel: targetChannel });
  }

  requestChatHistory(channel: string, before?: number, limit = 20): void {
    if (!this.socket?.connected) return;
    const normalizedChannel = this.buildSpaceChannel(channel);
    if (!before) {
      const store = useStore.getState();
      const meta = store.chatHistoryMeta[normalizedChannel || channel];
      const hasMessages =
        store.chatMessages.filter(
          msg =>
            (msg.channel || 'global') === normalizedChannel ||
            msg.channel === channel,
        ).length > 0;
      if (meta?.loaded || hasMessages) {
        store.setChatHistoryMeta(normalizedChannel || channel, {
          hasMore: meta?.hasMore ?? false,
          loaded: true,
        });
        return;
      }
      if (this.chatHistoryLoading.has(normalizedChannel || channel)) {
        return;
      }
      this.chatHistoryLoading.add(normalizedChannel || channel);
    }
    this.socket.emit('chat:history', {
      channel: normalizedChannel || channel,
      before,
      limit,
    });
  }

  requestSeamarksNearby(payload: {
    lat: number;
    lon: number;
    radiusMeters: number;
    bbox: { south: number; west: number; north: number; east: number };
    bboxKey: string;
    limit?: number;
  }) {
    this.socket?.emit('seamarks:nearby', payload);
  }

  sendClientLog(entry: {
    level: 'info' | 'warn' | 'error';
    source: string;
    message: string;
    meta?: Record<string, unknown>;
  }): void {
    if (!this.socket?.connected) return;
    this.socket.emit('client:log', entry);
  }

  // Update vessel position
  updateVesselPosition(
    _position: { x: number; y: number; z: number },
    _vesselData: SimpleVesselState,
  ) {
    // Function implementation
  }

  // Notify server about local mode changes (player/spectator)
  notifyModeChange(mode: 'player' | 'spectator'): void {
    if (!this.socket?.connected) return;
    this.socket.emit('user:mode', { mode });
  }

  sendAdminVesselMove(
    vesselId: string,
    position: { x?: number; y?: number; lat?: number; lon?: number },
  ): void {
    if (!this.socket?.connected) return;
    let nextPosition = { ...position };
    if (
      (position.x !== undefined || position.y !== undefined) &&
      (position.lat === undefined || position.lon === undefined)
    ) {
      const ll = positionToLatLon({
        x: position.x ?? 0,
        y: position.y ?? 0,
      });
      nextPosition = {
        ...nextPosition,
        lat: nextPosition.lat ?? ll.lat,
        lon: nextPosition.lon ?? ll.lon,
      };
    }
    this.socket.emit('admin:vessel:move', { vesselId, position: nextPosition });
  }

  sendAdminVesselMode(vesselId: string, mode: 'player' | 'ai'): void {
    if (!this.socket?.connected) return;
    this.socket.emit('admin:vesselMode', { vesselId, mode });
  }

  sendAdminVesselStop(vesselId: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('admin:vessel:stop', { vesselId });
  }

  sendAdminVesselRemove(vesselId: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('admin:vessel:remove', { vesselId });
  }

  sendAdminKick(userId: string, reason?: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('admin:kick', { userId, reason });
  }

  private buildSpaceChannel(channel?: string): string {
    const storeSpace = useStore.getState().spaceId;
    const space = (storeSpace || this.spaceId || 'global').trim().toLowerCase();
    const raw = (channel || 'global').trim();
    if (raw.startsWith('space:')) return raw;
    if (raw.startsWith('vessel:')) {
      const [, rest] = raw.split(':');
      const [id] = rest.split('_');
      return `space:${space}:vessel:${id}`;
    }
    return `space:${space}:${raw || 'global'}`;
  }

  // Attempt to reconnect to server
  private attemptReconnect(): void {
    if (this.reconnectTimer) return;

    this.connectionAttempts++;

    if (this.connectionAttempts > this.maxReconnectAttempts) {
      console.error(
        'Max reconnection attempts reached. Please refresh the page.',
      );
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.connectionAttempts), 30000);
    console.info(`Attempting to reconnect in ${delay / 1000} seconds...`);

    this.reconnectTimer = setTimeout(() => {
      console.info(`Reconnection attempt ${this.connectionAttempts}`);
      this.socket?.connect();
      this.reconnectTimer = null;
    }, delay);
  }

  // Disconnect from Socket.IO server
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.stopLatencySampling();
    this.stopResyncWatcher();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  // Generate a unique user ID
  private generateUserId(): string {
    return 'user_' + Math.random().toString(36).substring(2, 9);
  }

  // Allow setting an external auth token for the socket (e.g., NextAuth JWT)
  setAuthToken(token: string, userId?: string, username?: string): void {
    this.authToken = token;
    this.userId = userId || this.userId;
    this.username = username || this.username;
    const store = useStore.getState();
    this.spaceId = store.spaceId || this.spaceId;
    if (this.socket) {
      this.socket.auth = {
        token: this.authToken,
        userId: this.userId,
        username: this.username,
        spaceId: this.spaceId,
        mode: this.initialMode,
        autoJoin: this.autoJoin,
      };
    }
  }

  refreshAuth(token?: string | null, userId?: string, username?: string): void {
    this.authToken = token ?? null;
    if (userId !== undefined) {
      this.userId = userId || this.userId;
    }
    if (username !== undefined) {
      this.username = username || this.username;
    }
    const store = useStore.getState();
    this.spaceId = store.spaceId || this.spaceId;
    if (this.socket) {
      this.socket.auth = {
        ...(this.socket.auth || {}),
        token: this.authToken,
        userId: this.userId,
        username: this.username,
        spaceId: this.spaceId,
        mode: this.initialMode,
        autoJoin: this.autoJoin,
      };
      this.socket.emit('user:auth', {
        token: this.authToken,
        userId: this.userId,
        username: this.username,
      });
    }
  }

  setSpaceId(spaceId: string): void {
    this.spaceId = spaceId || 'global';
    if (this.socket) {
      this.socket.auth = {
        ...(this.socket.auth || {}),
        spaceId: this.spaceId,
      };
    }
  }

  setJoinPreference(mode: 'player' | 'spectator', autoJoin = true): void {
    this.initialMode = mode;
    this.autoJoin = autoJoin;
    if (this.socket) {
      this.socket.auth = {
        ...(this.socket.auth || {}),
        mode: this.initialMode,
        autoJoin: this.autoJoin,
      };
    }
  }

  // Check if we're connected to the server
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  waitForConnection(): Promise<void> {
    if (this.socket?.connected) {
      return Promise.resolve();
    }
    return new Promise(resolve => {
      this.connectResolvers.push(resolve);
    });
  }

  // Get current username from localStorage
  getUsername(): string {
    try {
      const storedAuth = localStorage.getItem('ship-sim-auth');
      if (storedAuth) {
        const auth = JSON.parse(storedAuth);
        return auth.username || 'Anonymous';
      }
    } catch (error) {
      console.error('Error getting username:', error);
    }
    return 'Anonymous';
  }

  // Send admin weather control command
  sendWeatherControl(
    options:
      | string
      | {
          pattern?: string;
          coordinates?: { lat: number; lng: number };
          mode?: 'auto' | 'manual';
        },
  ): void {
    if (!this.socket?.connected) {
      console.warn('Cannot send weather control: not connected');
      return;
    }

    const store = useStore.getState();
    const isAdmin = store.roles.includes('admin');

    if (!isAdmin) {
      console.warn('Cannot send weather control: not admin');
      return;
    }

    if (typeof options === 'string') {
      this.socket.emit('admin:weather', { pattern: options, mode: 'manual' });
      return;
    }

    const { pattern, coordinates, mode } = options;
    this.socket.emit('admin:weather', {
      pattern,
      coordinates,
      mode: mode || 'manual',
    });
  }

  // Enable random weather changes
  enableRandomWeather(): void {
    if (!this.socket?.connected) {
      console.warn('Cannot enable random weather: not connected');
      return;
    }

    this.sendWeatherControl({ mode: 'auto' });
  }
}

// Export as singleton
export const socketManager = new SocketManager();

export default socketManager;
