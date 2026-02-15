import { ensurePosition } from '../../lib/position';
import type { SocketStoreState } from '../adapters/socketStoreAdapter';
import type { EnvironmentState } from '../../types/environment.types';
import type {
  SimulationUpdateData,
  VesselTeleportData,
} from '../../types/socket.types';
import type { SimpleVesselState } from '../../types/vessel.types';
import {
  hasMoreFromSimulationCount,
  hasVesselChanged,
  mapSimulationChatHistory,
  resolvePreferredSelfId,
} from './simulationProjection';

export type SimulationHandlerState = {
  userId: string;
  hasHydratedSelf: boolean;
  lastSelfSnapshot: SimpleVesselState | null;
  selfHydrateResolvers: Array<(vessel: SimpleVesselState) => void>;
  lastSelfVesselId: string | null;
  lastSimulationTimestamp: number;
  lastSimulationUpdateAt: number;
};

type SimulationHandlerCallbacks = {
  getStoreState: () => SocketStoreState;
  setSpaceId: (spaceId: string) => void;
  setJoinPreference: (mode: 'player' | 'spectator', autoJoin?: boolean) => void;
  updateState: (updater: (state: SimulationHandlerState) => void) => void;
};

export const handleSimulationUpdate = (
  state: SimulationHandlerState,
  callbacks: SimulationHandlerCallbacks,
  data: SimulationUpdateData,
): void => {
  const store = callbacks.getStoreState();
  if (typeof data.timestamp === 'number') {
    if (data.timestamp < state.lastSimulationTimestamp) {
      return;
    }
    state.lastSimulationTimestamp = data.timestamp;
  }
  state.lastSimulationUpdateAt = Date.now();

  const previousSpaceId = store.spaceId;
  if (data.self?.roles) {
    store.setRoles(data.self.roles);
  }
  if (data.self?.userId && store.sessionUserId !== data.self.userId) {
    store.setSessionUserId(data.self.userId);
  }

  if (data.self) {
    const nextAccount: Record<string, number> = {};
    if (typeof data.self.rank === 'number') nextAccount.rank = data.self.rank;
    if (typeof data.self.credits === 'number')
      nextAccount.credits = data.self.credits;
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
      state.lastSelfVesselId = null;
    }
  }

  if (data.self?.spaceId) {
    store.setSpaceId(data.self.spaceId);
    callbacks.setSpaceId(data.self.spaceId);
  } else if (data.spaceId) {
    store.setSpaceId(data.spaceId);
    callbacks.setSpaceId(data.spaceId);
  }

  if (store.spaceId !== previousSpaceId) {
    state.lastSimulationTimestamp = 0;
    state.lastSimulationUpdateAt = Date.now();
  }

  if (data.spaceInfo) {
    store.setSpaceInfo(data.spaceInfo);
  }
  if (data.environment) {
    store.updateEnvironment(data.environment);
  }

  if (data.chatHistory) {
    const { messages, metaByChannel } = mapSimulationChatHistory(
      data.chatHistory,
    );
    store.setChatMessages(messages);
    metaByChannel.forEach((count, channel) => {
      store.setChatHistoryMeta(channel, {
        hasMore: hasMoreFromSimulationCount(count),
        loaded: true,
      });
    });
  }

  const currentOthers = store.otherVessels || {};
  const nextOthers = data.partial ? { ...currentOthers } : {};
  let changed = false;
  let foundSelf = false;
  const selfUserId = data.self?.userId || state.userId;

  const preferredSelfId = resolvePreferredSelfId({
    requestedVesselId: data.self?.vesselId,
    vessels: data.vessels,
    selfUserId,
    currentVesselId: store.currentVesselId,
  });

  Object.entries(data.vessels).forEach(([id, vesselData]) => {
    const normalized = {
      ...vesselData,
      position: ensurePosition(vesselData.position),
    };

    const isSelf =
      (preferredSelfId ? id === preferredSelfId : false) ||
      id === state.userId ||
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
      if (!state.hasHydratedSelf) {
        state.hasHydratedSelf = true;
        store.setCurrentVesselId(id);
        state.lastSelfSnapshot = normalized;
        state.selfHydrateResolvers.forEach(resolve => resolve(normalized));
        state.selfHydrateResolvers = [];
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
        state.lastSelfVesselId !== id
      ) {
        state.lastSelfVesselId = id;
        const pos = normalized.position;
        if (Number.isFinite(pos.x) && Number.isFinite(pos.y)) {
          void import('../../simulation')
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
        const failureChanged =
          (prevFailure?.engineFailure ?? false) !==
            normalized.failureState.engineFailure ||
          (prevFailure?.steeringFailure ?? false) !==
            normalized.failureState.steeringFailure ||
          (prevFailure?.floodingLevel ?? 0) !==
            normalized.failureState.floodingLevel;

        if (
          failureChanged &&
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
          failureChanged &&
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
          failureChanged &&
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
        callbacks.setJoinPreference('spectator', false);
        state.lastSelfVesselId = null;
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

  if (!foundSelf && !state.hasHydratedSelf && data.self) {
    const fallback: SimpleVesselState = {
      id: state.userId,
      position: store.vessel.position,
      orientation: store.vessel.orientation,
      velocity: store.vessel.velocity,
      controls: store.vessel.controls,
    };
    state.hasHydratedSelf = true;
    state.lastSelfSnapshot = fallback;
    state.selfHydrateResolvers.forEach(resolve => resolve(fallback));
    state.selfHydrateResolvers = [];
  }

  callbacks.updateState(next => {
    next.hasHydratedSelf = state.hasHydratedSelf;
    next.lastSelfSnapshot = state.lastSelfSnapshot;
    next.selfHydrateResolvers = state.selfHydrateResolvers;
    next.lastSelfVesselId = state.lastSelfVesselId;
    next.lastSimulationTimestamp = state.lastSimulationTimestamp;
    next.lastSimulationUpdateAt = state.lastSimulationUpdateAt;
  });
};

export const handleVesselTeleport = (
  getStoreState: () => SocketStoreState,
  data: VesselTeleportData,
): void => {
  if (!data?.vesselId || !data.position) return;
  const store = getStoreState();
  const currentId = store.currentVesselId;
  if (!currentId) return;
  const normalized = data.vesselId.split('_')[0];
  const normalizedCurrent = currentId.split('_')[0];
  if (normalized !== normalizedCurrent) return;
  void import('../../simulation')
    .then(({ getSimulationLoop }) => {
      const normalizedPosition = ensurePosition(data.position);
      getSimulationLoop().teleportVessel({
        x: normalizedPosition.x ?? 0,
        y: normalizedPosition.y ?? 0,
        z: normalizedPosition.z,
      });
    })
    .catch(error => {
      console.error('Failed to teleport vessel:', error);
    });
};

export const handleEnvironmentUpdate = (
  getStoreState: () => SocketStoreState,
  data: EnvironmentState,
): void => {
  getStoreState().updateEnvironment(data);
};
