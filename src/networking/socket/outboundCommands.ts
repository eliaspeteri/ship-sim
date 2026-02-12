import { positionToLatLon } from '../../lib/position';
import { VesselControlData, VesselUpdateData } from '../../types/socket.types';
import { SocketStoreState } from '../adapters/socketStoreAdapter';
import { ClientSocket } from './types';

export const buildSpaceChannel = (
  channel: string | undefined,
  storeSpaceId: string | undefined,
  fallbackSpaceId: string,
): string => {
  const space = (storeSpaceId || fallbackSpaceId || 'global')
    .trim()
    .toLowerCase();
  const raw = (channel || 'global').trim();
  if (raw.startsWith('space:')) return raw;
  if (raw.startsWith('vessel:')) {
    const [, rest] = raw.split(':');
    const [id] = rest.split('_');
    return `space:${space}:vessel:${id}`;
  }
  return `space:${space}:${raw || 'global'}`;
};

export const sendVesselUpdate = (
  socket: ClientSocket,
  userId: string,
  vessel: {
    position: VesselUpdateData['position'];
    orientation: VesselUpdateData['orientation'];
    velocity: VesselUpdateData['velocity'];
    angularVelocity?: VesselUpdateData['angularVelocity'];
  },
): void => {
  const updateData: VesselUpdateData = {
    userId,
    position: vessel.position,
    orientation: vessel.orientation,
    velocity: vessel.velocity,
    angularVelocity: vessel.angularVelocity,
  };
  socket.emit('vessel:update', updateData);
};

type ControlDiff = {
  hasThrottleChange: boolean;
  hasRudderChange: boolean;
  hasBallastChange: boolean;
};

export const detectControlDiff = (
  last: {
    throttle?: number;
    rudderAngle?: number;
    ballast?: number;
  },
  next: {
    throttle?: number;
    rudderAngle?: number;
    ballast?: number;
  },
): ControlDiff => {
  const epsilon = 0.0005;
  return {
    hasThrottleChange:
      next.throttle !== undefined &&
      Math.abs(next.throttle - (last.throttle ?? 0)) > epsilon,
    hasRudderChange:
      next.rudderAngle !== undefined &&
      Math.abs(next.rudderAngle - (last.rudderAngle ?? 0)) > epsilon,
    hasBallastChange:
      next.ballast !== undefined &&
      Math.abs(next.ballast - (last.ballast ?? 0)) > epsilon,
  };
};

export const sendControlUpdate = (
  socket: ClientSocket,
  userId: string,
  controls: {
    throttle?: number;
    rudderAngle?: number;
    ballast?: number;
  },
): VesselControlData => {
  const controlData: VesselControlData = {
    userId,
    throttle: controls.throttle,
    rudderAngle: controls.rudderAngle,
    ballast: controls.ballast,
  };
  console.info(
    `Sending control update: ${JSON.stringify(controlData, null, 2)}`,
  );
  socket.emit('vessel:control', controlData);
  return controlData;
};

export const buildPositionPayload = (position?: {
  x?: number;
  y?: number;
  lat?: number;
  lon?: number;
}):
  | {
      x?: number;
      y?: number;
      lat?: number;
      lon?: number;
    }
  | undefined => {
  if (
    position &&
    (position.x !== undefined || position.y !== undefined) &&
    (position.lat === undefined || position.lon === undefined)
  ) {
    const ll = positionToLatLon({
      x: position.x ?? 0,
      y: position.y ?? 0,
    });
    return {
      ...position,
      lat: position.lat ?? ll.lat,
      lon: position.lon ?? ll.lon,
    };
  }
  return position;
};

export const emitRepairRequest = (
  socket: ClientSocket,
  vesselId: string | undefined,
  getStoreState: () => SocketStoreState,
): void => {
  const store = getStoreState();
  socket.emit(
    'vessel:repair',
    { vesselId },
    (res?: { ok: boolean; message?: string }) => {
      if (res?.ok) {
        store.setNotice({
          type: 'info',
          message: res.message || 'Repairs complete',
        });
      } else if (res?.message) {
        store.setNotice({ type: 'error', message: res.message });
      }
    },
  );
};

export const canSendWeatherControl = (
  getStoreState: () => SocketStoreState,
): boolean => {
  const store = getStoreState();
  return store.roles.includes('admin');
};
