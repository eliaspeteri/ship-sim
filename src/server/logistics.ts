import { prisma } from '../lib/prisma';
import { distanceMeters } from '../lib/position';
import {
  ECONOMY_PORTS,
  applyEconomyAdjustmentWithRevenueShare,
} from './economy';

const CARGO_GENERATION_INTERVAL_MS = 5 * 60 * 1000;
const PASSENGER_GENERATION_INTERVAL_MS = 8 * 60 * 1000;
const CARGO_EXPIRY_SWEEP_MS = 2 * 60 * 1000;
const PASSENGER_EXPIRY_SWEEP_MS = 2 * 60 * 1000;
const DELIVERY_RADIUS_M = 260;
const TURNAROUND_BASE_MINUTES = 6;
const TURNAROUND_CONGESTION_MINUTES = 18;

const PORT_CAPACITY = {
  small: { min: 4, max: 8 },
  medium: { min: 6, max: 14 },
  large: { min: 10, max: 22 },
};

const PASSENGER_CAPACITY = {
  small: { min: 2, max: 5 },
  medium: { min: 4, max: 10 },
  large: { min: 8, max: 18 },
};

const REGION_CARGO_TYPES: Record<string, string[]> = {
  north: ['bulk', 'refrigerated', 'hazardous'],
  south: ['bulk', 'supplies', 'parcels'],
  islands: ['fish', 'parcels', 'supplies'],
  east: ['bulk', 'refrigerated', 'parcels'],
  default: ['bulk', 'parcels', 'supplies'],
};

const SMALL_CRAFT_TYPES = ['fish', 'parcels', 'supplies'];

const randBetween = (min: number, max: number) =>
  Math.floor(min + Math.random() * (max - min + 1));

const pick = <T>(list: T[]) => list[Math.floor(Math.random() * list.length)];

const portById = new Map(ECONOMY_PORTS.map(port => [port.id, port]));

const resolveDestination = (originId: string) => {
  const choices = ECONOMY_PORTS.filter(port => port.id !== originId);
  return pick(choices);
};

const buildCargoValue = (cargoType: string, weightTons: number) => {
  const multiplier =
    cargoType === 'hazardous'
      ? 1.8
      : cargoType === 'refrigerated'
        ? 1.4
        : cargoType === 'fish'
          ? 1.2
          : cargoType === 'parcels'
            ? 1.1
            : 1.0;
  return Math.round(weightTons * 120 * multiplier);
};

const buildCargoWeight = (cargoType: string) => {
  if (SMALL_CRAFT_TYPES.includes(cargoType)) {
    return randBetween(2, 16);
  }
  return randBetween(18, 80);
};

const buildCargoExpiry = () => {
  const hours = randBetween(2, 8);
  return new Date(Date.now() + hours * 60 * 60 * 1000);
};

const buildPassengerReward = (paxCount: number, passengerType: string) => {
  const multiplier = passengerType === 'water_taxi' ? 1.6 : 1.0;
  return Math.round(paxCount * 45 * multiplier);
};

const buildPassengerExpiry = () => {
  const hours = randBetween(1, 5);
  return new Date(Date.now() + hours * 60 * 60 * 1000);
};

let lastCargoGenerationAt = 0;
let lastPassengerGenerationAt = 0;
let lastCargoExpirySweepAt = 0;
let lastPassengerExpirySweepAt = 0;

export const getPortCongestion = async () => {
  const ports = ECONOMY_PORTS;
  const cargoCounts = await prisma.cargoLot.groupBy({
    by: ['portId'],
    where: { status: 'listed' },
    _count: { _all: true },
  });
  const paxCounts = await prisma.passengerContract.groupBy({
    by: ['originPortId'],
    where: { status: 'listed' },
    _count: { _all: true },
  });
  const cargoMap = new Map(
    cargoCounts.map(
      (row: { portId?: string | null; _count: { _all: number } }) => [
        row.portId || '',
        row._count._all,
      ],
    ),
  );
  const paxMap = new Map(
    paxCounts.map(
      (row: { originPortId?: string | null; _count: { _all: number } }) => [
        row.originPortId || '',
        row._count._all,
      ],
    ),
  );
  return ports.map(port => {
    const cap = PORT_CAPACITY[port.size as keyof typeof PORT_CAPACITY];
    const target = cap?.max ?? 10;
    const cargo = Number(cargoMap.get(port.id) ?? 0);
    const pax = Number(paxMap.get(port.id) ?? 0);
    const load = cargo + pax * 1.5;
    const ratio = Math.min(1, load / Math.max(1, target));
    return { portId: port.id, congestion: ratio };
  });
};

export const computeTurnaroundDelayMs = (congestion: number) => {
  const minutes =
    TURNAROUND_BASE_MINUTES + TURNAROUND_CONGESTION_MINUTES * congestion;
  return Math.round(minutes * 60 * 1000);
};

export const ensureCargoAvailability = async (now: number) => {
  if (now - lastCargoGenerationAt < CARGO_GENERATION_INTERVAL_MS) return;
  lastCargoGenerationAt = now;

  for (const port of ECONOMY_PORTS) {
    const caps = PORT_CAPACITY[port.size as keyof typeof PORT_CAPACITY];
    const target = caps?.min ?? 6;
    const existing = await prisma.cargoLot.count({
      where: { portId: port.id, status: 'listed' },
    });
    const needed = Math.max(0, target - existing);
    if (needed === 0) continue;
    const cargoTypes =
      REGION_CARGO_TYPES[port.region] || REGION_CARGO_TYPES.default;
    const createData = Array.from({ length: needed }).map(() => {
      const cargoType = pick(cargoTypes);
      const weightTons = buildCargoWeight(cargoType);
      const destination = resolveDestination(port.id);
      const value = buildCargoValue(cargoType, weightTons);
      return {
        portId: port.id,
        originPortId: port.id,
        destinationPortId: destination.id,
        cargoType,
        description: `${cargoType.replace('_', ' ')} shipment`,
        value,
        rewardCredits: Math.round(value * 1.15),
        weightTons,
        liabilityRate: cargoType === 'hazardous' ? 0.02 : 0.01,
        status: 'listed',
        expiresAt: buildCargoExpiry(),
      };
    });
    if (createData.length > 0) {
      await prisma.cargoLot.createMany({ data: createData });
    }
  }
};

export const ensurePassengerAvailability = async (now: number) => {
  if (now - lastPassengerGenerationAt < PASSENGER_GENERATION_INTERVAL_MS)
    return;
  lastPassengerGenerationAt = now;
  const passengerTypes = ['ferry', 'water_bus', 'water_taxi'];

  for (const port of ECONOMY_PORTS) {
    const caps =
      PASSENGER_CAPACITY[port.size as keyof typeof PASSENGER_CAPACITY];
    const target = caps?.min ?? 4;
    const existing = await prisma.passengerContract.count({
      where: { originPortId: port.id, status: 'listed' },
    });
    const needed = Math.max(0, target - existing);
    if (needed === 0) continue;
    const createData = Array.from({ length: needed }).map(() => {
      const passengerType = pick(passengerTypes);
      const destination = resolveDestination(port.id);
      const paxCount =
        passengerType === 'water_taxi'
          ? randBetween(2, 6)
          : passengerType === 'water_bus'
            ? randBetween(6, 16)
            : randBetween(12, 60);
      const rewardCredits = buildPassengerReward(paxCount, passengerType);
      return {
        originPortId: port.id,
        destinationPortId: destination.id,
        passengerType,
        paxCount,
        rewardCredits,
        status: 'listed',
        expiresAt: buildPassengerExpiry(),
      };
    });
    if (createData.length > 0) {
      await prisma.passengerContract.createMany({ data: createData });
    }
  }
};

export const sweepExpiredCargo = async (now: number) => {
  if (now - lastCargoExpirySweepAt < CARGO_EXPIRY_SWEEP_MS) return;
  lastCargoExpirySweepAt = now;
  const expired = await prisma.cargoLot.findMany({
    where: {
      status: 'listed',
      expiresAt: { lt: new Date(now) },
    },
  });
  if (!expired.length) return;
  await prisma.cargoLot.updateMany({
    where: {
      id: { in: expired.map((lot: { id: string }) => lot.id) },
    },
    data: { status: 'expired' },
  });
  for (const lot of expired) {
    if (!lot.originPortId) continue;
    const destination = resolveDestination(lot.originPortId);
    await prisma.cargoLot.create({
      data: {
        portId: lot.originPortId,
        originPortId: lot.originPortId,
        destinationPortId: destination.id,
        cargoType: lot.cargoType || 'bulk',
        description: lot.description || 'rerouted cargo',
        value: lot.value,
        rewardCredits: lot.rewardCredits || Math.round(lot.value * 1.1),
        weightTons: lot.weightTons,
        liabilityRate: lot.liabilityRate ?? 0,
        status: 'listed',
        expiresAt: buildCargoExpiry(),
      },
    });
  }
};

export const sweepExpiredPassengers = async (now: number) => {
  if (now - lastPassengerExpirySweepAt < PASSENGER_EXPIRY_SWEEP_MS) return;
  lastPassengerExpirySweepAt = now;
  await prisma.passengerContract.updateMany({
    where: {
      status: 'listed',
      expiresAt: { lt: new Date(now) },
    },
    data: { status: 'expired' },
  });
};

export const updateCargoDeliveries = async (params: {
  vessels: Map<string, { position: { lat: number; lon: number } }>;
}) => {
  const now = Date.now();
  await prisma.cargoLot.updateMany({
    where: { status: 'loading', readyAt: { lte: new Date(now) } },
    data: { status: 'loaded', readyAt: null },
  });
  const cargo = await prisma.cargoLot.findMany({
    where: { status: 'loaded', vesselId: { not: null } },
  });
  if (!cargo.length) return;
  for (const lot of cargo) {
    if (!lot.vesselId || !lot.destinationPortId) continue;
    const vessel = params.vessels.get(lot.vesselId);
    if (!vessel) continue;
    const dest = portById.get(lot.destinationPortId);
    if (!dest) continue;
    const distance = distanceMeters(vessel.position, dest.position);
    if (distance > DELIVERY_RADIUS_M) continue;
    await prisma.cargoLot.update({
      where: { id: lot.id },
      data: { status: 'delivered', vesselId: null, portId: dest.id },
    });
    if (lot.carrierId) {
      await applyEconomyAdjustmentWithRevenueShare({
        userId: lot.carrierId,
        vesselId: lot.vesselId,
        deltaCredits: lot.rewardCredits || lot.value,
        reason: 'cargo_delivery',
        meta: { cargoId: lot.id, destination: dest.id },
      });
    }
  }
};

export const updatePassengerDeliveries = async (params: {
  vessels: Map<string, { position: { lat: number; lon: number } }>;
}) => {
  const now = Date.now();
  await prisma.passengerContract.updateMany({
    where: { status: 'boarding', readyAt: { lte: new Date(now) } },
    data: { status: 'in_progress', readyAt: null },
  });
  const contracts = await prisma.passengerContract.findMany({
    where: { status: 'in_progress', vesselId: { not: null } },
  });
  if (!contracts.length) return;
  for (const contract of contracts) {
    if (!contract.vesselId) continue;
    const vessel = params.vessels.get(contract.vesselId);
    if (!vessel) continue;
    const dest = portById.get(contract.destinationPortId);
    if (!dest) continue;
    const distance = distanceMeters(vessel.position, dest.position);
    if (distance > DELIVERY_RADIUS_M) continue;
    await prisma.passengerContract.update({
      where: { id: contract.id },
      data: { status: 'completed', vesselId: null },
    });
    if (contract.operatorId) {
      await applyEconomyAdjustmentWithRevenueShare({
        userId: contract.operatorId,
        vesselId: contract.vesselId,
        deltaCredits: contract.rewardCredits,
        reason: 'passenger_delivery',
        meta: { passengerContractId: contract.id, destination: dest.id },
      });
    }
  }
};
