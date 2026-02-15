import { mergePosition } from '../../lib/position';
import type { DeepPartial } from '../../types/utility';
import type {
  CrewStationAssignment,
  VesselState,
  VesselStations,
} from '../../types/vessel.types';
import type { CrewStationEntries } from '../types';

const mergeStationAssignment = (
  current: CrewStationAssignment | undefined,
  update?: DeepPartial<CrewStationAssignment>,
): CrewStationAssignment | undefined => {
  if (!update) return current;
  return {
    userId: update.userId ?? current?.userId ?? null,
    username: update.username ?? current?.username ?? null,
  };
};

const mergeNumberParams = (
  base?: Record<string, number>,
  update?: Record<string, number | undefined>,
): Record<string, number> => {
  const merged: Record<string, number> = { ...(base || {}) };
  if (update) {
    Object.entries(update).forEach(([key, value]) => {
      if (typeof value === 'number') {
        merged[key] = value;
      }
    });
  }
  return merged;
};

export const mergeVesselUpdate = (
  current: VesselState,
  vesselUpdate: DeepPartial<VesselState>,
): VesselState => {
  const updatedVessel = { ...current };

  if (vesselUpdate.position) {
    updatedVessel.position = mergePosition(
      updatedVessel.position,
      vesselUpdate.position,
    );
  }
  if (vesselUpdate.orientation) {
    updatedVessel.orientation = {
      ...updatedVessel.orientation,
      ...vesselUpdate.orientation,
    };
  }
  if (vesselUpdate.velocity) {
    updatedVessel.velocity = {
      ...updatedVessel.velocity,
      ...vesselUpdate.velocity,
    };
  }
  if (vesselUpdate.angularVelocity) {
    updatedVessel.angularVelocity = {
      ...updatedVessel.angularVelocity,
      ...vesselUpdate.angularVelocity,
    };
  }
  if (vesselUpdate.controls) {
    updatedVessel.controls = {
      ...updatedVessel.controls,
      ...vesselUpdate.controls,
    };
  }
  if (vesselUpdate.waterDepth !== undefined) {
    updatedVessel.waterDepth = vesselUpdate.waterDepth;
  }
  if (vesselUpdate.helm) {
    updatedVessel.helm = mergeStationAssignment(
      updatedVessel.helm,
      vesselUpdate.helm,
    );
  }
  if (vesselUpdate.stations) {
    const nextStations: VesselStations = {
      ...(updatedVessel.stations || {}),
    };
    (Object.entries(vesselUpdate.stations) as CrewStationEntries).forEach(
      ([station, assignment]) => {
        const merged = mergeStationAssignment(
          nextStations[station],
          assignment,
        );
        if (merged) {
          nextStations[station] = merged;
        }
      },
    );
    updatedVessel.stations = nextStations;
    if (vesselUpdate.stations.helm) {
      updatedVessel.helm = mergeStationAssignment(
        updatedVessel.helm,
        vesselUpdate.stations.helm,
      );
    }
  }
  if (vesselUpdate.properties) {
    updatedVessel.properties = {
      ...updatedVessel.properties,
      ...vesselUpdate.properties,
    };
  }
  if (vesselUpdate.hydrodynamics) {
    updatedVessel.hydrodynamics = {
      ...updatedVessel.hydrodynamics,
      ...vesselUpdate.hydrodynamics,
    };
  }
  if (vesselUpdate.physics) {
    const currentPhysics = updatedVessel.physics ?? {
      model: 'displacement',
      schemaVersion: 1,
      params: {},
    };
    updatedVessel.physics = {
      ...currentPhysics,
      ...vesselUpdate.physics,
      model:
        vesselUpdate.physics.model ?? currentPhysics.model ?? 'displacement',
      schemaVersion:
        vesselUpdate.physics.schemaVersion ?? currentPhysics.schemaVersion ?? 1,
      params: mergeNumberParams(
        currentPhysics.params,
        vesselUpdate.physics.params as Record<string, number | undefined>,
      ),
    };
  }
  if (vesselUpdate.render) {
    updatedVessel.render = {
      ...(updatedVessel.render || {}),
      ...vesselUpdate.render,
    };
  }
  if (vesselUpdate.engineState) {
    updatedVessel.engineState = {
      ...updatedVessel.engineState,
      ...vesselUpdate.engineState,
    };
  }
  if (vesselUpdate.electricalSystem) {
    updatedVessel.electricalSystem = {
      ...updatedVessel.electricalSystem,
      ...vesselUpdate.electricalSystem,
    };
  }
  if (vesselUpdate.stability) {
    const baseStability = updatedVessel.stability ?? {
      metacentricHeight: 2.0,
      centerOfGravity: { x: 0, y: 0, z: 6.0 },
      trim: 0,
      list: 0,
    };
    const stabilityUpdate = vesselUpdate.stability;
    updatedVessel.stability = {
      metacentricHeight:
        stabilityUpdate.metacentricHeight ?? baseStability.metacentricHeight,
      centerOfGravity: {
        x:
          stabilityUpdate.centerOfGravity?.x ?? baseStability.centerOfGravity.x,
        y:
          stabilityUpdate.centerOfGravity?.y ?? baseStability.centerOfGravity.y,
        z:
          stabilityUpdate.centerOfGravity?.z ?? baseStability.centerOfGravity.z,
      },
      trim: stabilityUpdate.trim ?? baseStability.trim,
      list: stabilityUpdate.list ?? baseStability.list,
    };
  }
  if (vesselUpdate.alarms) {
    const nextAlarms = { ...updatedVessel.alarms };
    const alarmUpdates = vesselUpdate.alarms;
    if (typeof alarmUpdates.engineOverheat === 'boolean') {
      nextAlarms.engineOverheat = alarmUpdates.engineOverheat;
    }
    if (typeof alarmUpdates.lowOilPressure === 'boolean') {
      nextAlarms.lowOilPressure = alarmUpdates.lowOilPressure;
    }
    if (typeof alarmUpdates.lowFuel === 'boolean') {
      nextAlarms.lowFuel = alarmUpdates.lowFuel;
    }
    if (typeof alarmUpdates.fireDetected === 'boolean') {
      nextAlarms.fireDetected = alarmUpdates.fireDetected;
    }
    if (typeof alarmUpdates.collisionAlert === 'boolean') {
      nextAlarms.collisionAlert = alarmUpdates.collisionAlert;
    }
    if (typeof alarmUpdates.stabilityWarning === 'boolean') {
      nextAlarms.stabilityWarning = alarmUpdates.stabilityWarning;
    }
    if (typeof alarmUpdates.generatorFault === 'boolean') {
      nextAlarms.generatorFault = alarmUpdates.generatorFault;
    }
    if (typeof alarmUpdates.blackout === 'boolean') {
      nextAlarms.blackout = alarmUpdates.blackout;
    }
    if (alarmUpdates.otherAlarms) {
      const nextOther = { ...nextAlarms.otherAlarms };
      Object.entries(alarmUpdates.otherAlarms).forEach(([key, value]) => {
        if (typeof value === 'boolean') {
          nextOther[key] = value;
        }
      });
      nextAlarms.otherAlarms = nextOther;
    }
    updatedVessel.alarms = nextAlarms;
  }
  if (vesselUpdate.failureState) {
    updatedVessel.failureState = {
      ...(updatedVessel.failureState || {
        engineFailure: false,
        steeringFailure: false,
        floodingLevel: 0,
      }),
      ...vesselUpdate.failureState,
    };
  }
  if (vesselUpdate.damageState) {
    updatedVessel.damageState = {
      ...(updatedVessel.damageState || {
        hullIntegrity: 1,
        engineHealth: 1,
        steeringHealth: 1,
        electricalHealth: 1,
        floodingDamage: 0,
      }),
      ...vesselUpdate.damageState,
    };
  }

  return updatedVessel;
};

export const isValidVesselState = (value: unknown): value is VesselState =>
  Boolean(value && typeof value === 'object');
