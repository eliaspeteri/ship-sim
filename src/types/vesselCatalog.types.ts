import type { VesselPhysicsConfig } from './physics.types';
import type { ShipType } from './vessel.types';

export type VesselCatalogEntry = {
  id: string;
  name: string;
  description?: string;
  shipType: ShipType;
  modelPath?: string | null;
  properties: {
    mass: number;
    length: number;
    beam: number;
    draft: number;
    blockCoefficient: number;
    maxSpeed: number;
  };
  hydrodynamics?: Partial<{
    rudderForceCoefficient: number;
    rudderStallAngle: number;
    rudderMaxAngle: number;
    dragCoefficient: number;
    yawDamping: number;
    yawDampingQuad: number;
    swayDamping: number;
    maxThrust: number;
    rollDamping: number;
    pitchDamping: number;
    heaveStiffness: number;
    heaveDamping: number;
  }>;
  physics?: VesselPhysicsConfig;
  render?: {
    modelYawDeg?: number;
    sinkFactor?: number;
    heaveScale?: number;
  };
  commerce?: {
    purchasePrice?: number;
    charterRatePerHour?: number;
    leaseRatePerHour?: number;
    revenueShare?: number;
    minRank?: number;
  };
  tags?: string[];
};

export type VesselCatalog = {
  entries: VesselCatalogEntry[];
  byId: Map<string, VesselCatalogEntry>;
};
