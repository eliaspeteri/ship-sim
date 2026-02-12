import { SimpleVesselState } from '../../types/vessel.types';
import { ChatMessageData } from '../../types/socket.types';
import { CHAT_HISTORY_PAGE_SIZE } from './types';

export const hasVesselChanged = (
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

type PreferredSelfIdInput = {
  requestedVesselId?: string;
  vessels: Record<string, SimpleVesselState>;
  selfUserId: string;
  currentVesselId?: string | null;
};

export const resolvePreferredSelfId = ({
  requestedVesselId,
  vessels,
  selfUserId,
  currentVesselId,
}: PreferredSelfIdInput): string | undefined => {
  let preferredSelfId = requestedVesselId;
  if (preferredSelfId && !vessels[preferredSelfId]) {
    preferredSelfId = Object.keys(vessels).find(
      id => id.split('_')[0] === preferredSelfId,
    );
  }

  if (!preferredSelfId) {
    preferredSelfId = Object.entries(vessels).find(([, vessel]) =>
      Array.isArray(vessel.crewIds)
        ? vessel.crewIds.includes(selfUserId)
        : false,
    )?.[0];
  }

  if (!preferredSelfId && currentVesselId && vessels[currentVesselId]) {
    preferredSelfId = currentVesselId;
  }

  if (!preferredSelfId) {
    const ownerMatches = Object.entries(vessels).filter(
      ([, vessel]) => vessel.ownerId === selfUserId,
    );
    if (ownerMatches.length === 1) {
      preferredSelfId = ownerMatches[0][0];
    }
  }

  return preferredSelfId;
};

export const mapSimulationChatHistory = (
  history: ChatMessageData[] = [],
  now = Date.now,
): { messages: ChatMessageData[]; metaByChannel: Map<string, number> } => {
  const messages = history.map(message => ({
    userId: message.userId,
    username: message.username,
    message: message.message,
    timestamp: message.timestamp || now(),
    channel: message.channel || 'global',
  }));
  const metaByChannel = new Map<string, number>();
  history.forEach(message => {
    const channel = message.channel || 'global';
    metaByChannel.set(channel, (metaByChannel.get(channel) || 0) + 1);
  });

  return { messages, metaByChannel };
};

export const hasMoreFromSimulationCount = (count: number): boolean =>
  count >= CHAT_HISTORY_PAGE_SIZE;
