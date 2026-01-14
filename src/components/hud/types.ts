export type HudTab =
  | 'vessels'
  | 'navigation'
  | 'ecdis'
  | 'sounder'
  | 'conning'
  | 'weather'
  | 'systems'
  | 'missions'
  | 'replay'
  | 'spaces'
  | 'chat'
  | 'events'
  | 'radio'
  | 'radar'
  | 'alarms'
  | 'admin';

export type FleetVessel = {
  id: string;
  status?: string | null;
  storagePortId?: string | null;
  spaceId?: string | null;
  ownerId?: string | null;
  chartererId?: string | null;
  leaseeId?: string | null;
  lat: number;
  lon: number;
  z: number;
  lastUpdate: string | Date;
};

export type EconomyPort = {
  id: string;
  name: string;
  position: { lat: number; lon: number; z?: number };
};

export type EconomyTransaction = {
  id: string;
  amount: number;
  reason: string;
  createdAt: string;
  vesselId?: string | null;
  meta?: Record<string, unknown> | null;
};
