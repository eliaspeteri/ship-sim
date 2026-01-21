export type EconomyDashboard = {
  profile: {
    rank: number;
    experience: number;
    credits: number;
    safetyScore: number;
  };
  currentPort?: { id: string; name: string } | null;
  ports: {
    id: string;
    name: string;
    listedCargo: number;
    listedPassengers?: number;
    congestion?: number;
  }[];
  passengerContracts?: Array<{
    id: string;
    originPortId: string;
    destinationPortId: string;
    passengerType: string;
    paxCount: number;
    rewardCredits: number;
    status: string;
  }>;
  fleet: {
    id: string;
    spaceId?: string | null;
    ownerId?: string | null;
    status?: string | null;
    lastUpdate: string | Date;
  }[];
  loans: Array<{
    id: string;
    balance: number;
    status: string;
    dueAt?: string | null;
  }>;
  insurance: Array<{
    id: string;
    vesselId: string;
    type: string;
    premiumRate: number;
    status: string;
  }>;
  leases: Array<{
    id: string;
    vesselId: string;
    type: string;
    status: string;
    ratePerHour: number;
    revenueShare?: number;
    ownerId?: string | null;
    lesseeId?: string | null;
    endsAt?: string | null;
  }>;
  sales: Array<{
    id: string;
    vesselId: string;
    type: string;
    status: string;
    price: number;
  }>;
  missions: Array<{
    id: string;
    name: string;
    rewardCredits: number;
    requiredRank: number;
  }>;
};

export type CargoLot = {
  id: string;
  description?: string | null;
  value: number;
  weightTons: number;
  liabilityRate?: number | null;
  destinationPortId?: string | null;
  status: string;
};

export type PassengerContract = {
  id: string;
  originPortId: string;
  destinationPortId: string;
  passengerType: string;
  paxCount: number;
  rewardCredits: number;
  status: string;
};

export type CareerStatus = {
  id: string;
  careerId: string;
  level: number;
  experience: number;
  active: boolean;
  career?: { id: string; name: string; description?: string | null };
};

export type License = {
  id: string;
  licenseKey: string;
  status: string;
  expiresAt?: string | null;
};

export type Exam = {
  id: string;
  name: string;
  description?: string;
  minScore: number;
  careerId?: string;
  licenseKey?: string;
};

export type Reputation = {
  id: string;
  scopeType: string;
  scopeId: string;
  value: number;
};

export type SpaceSummary = {
  id: string;
  name: string;
  visibility?: string;
  rulesetType?: string;
};

export type VesselCatalogEntry = {
  id: string;
  name: string;
  description?: string;
  shipType: string;
  modelPath?: string | null;
  properties: {
    mass: number;
    length: number;
    beam: number;
    draft: number;
    blockCoefficient: number;
    maxSpeed: number;
  };
  commerce?: {
    purchasePrice?: number;
    charterRatePerHour?: number;
    leaseRatePerHour?: number;
    revenueShare?: number;
    minRank?: number;
  };
  capacities?: {
    cargoTons: number;
    passengers: number;
  };
  tags?: string[];
};
