import { randomUUID } from 'crypto';

import { positionFromLatLon } from '../../lib/position';
import {
  ECONOMY_PORTS,
  getEconomyProfile,
  getVesselCargoCapacityTons,
  getVesselPassengerCapacity,
  estimateCargoCapacityTons,
  estimatePassengerCapacity,
  resolvePortForPosition,
} from '../economy';
import { computeTurnaroundDelayMs, getPortCongestion } from '../logistics';
import {
  getVesselCatalog,
  resolveVesselTemplate,
  warmVesselCatalog,
} from '../vesselCatalog';

import type { prisma as prismaClient } from '../../lib/prisma';
import type { AuthenticatedUser } from '../middleware/authentication';
import type { Router, RequestHandler, Request, Response } from 'express';

type PrismaClient = typeof prismaClient;

type RequirePermission = (domain: string, action: string) => RequestHandler;
type RequireUser = (req: Request, res: Response) => AuthenticatedUser | null;

type EconomyRouteDeps = {
  router: Router;
  prisma: PrismaClient;
  requireAuth: RequestHandler;
  requirePermission: RequirePermission;
  requireUser: RequireUser;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : {};

const readString = (
  record: Record<string, unknown>,
  key: string,
): string | undefined => {
  const value = record[key];
  return typeof value === 'string' ? value : undefined;
};

const readNumber = (
  record: Record<string, unknown>,
  key: string,
): number | undefined => {
  const value = record[key];
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

export const registerEconomyRoutes = ({
  router,
  prisma,
  requireAuth,
  requirePermission,
  requireUser,
}: EconomyRouteDeps) => {
  const SHIPYARD_USER_ID = 'system_shipyard';
  const DEFAULT_CHARTER_TERM_HOURS = 48;
  const DEFAULT_LEASE_TERM_HOURS = 168;
  const MAX_TERM_HOURS = 24 * 30;

  const ensureShipyardUser = async () => {
    const existing = await prisma.user.findUnique({
      where: { id: SHIPYARD_USER_ID },
    });
    if (existing) return existing;
    return prisma.user.create({
      data: {
        id: SHIPYARD_USER_ID,
        name: 'Shipyard',
        role: 'system',
        credits: 0,
      },
    });
  };

  const resolvePortById = (portId?: string | null) =>
    ECONOMY_PORTS.find(port => port.id === portId) || ECONOMY_PORTS[0];

  const buildVesselCreateData = ({
    id,
    templateId,
    spaceId,
    ownerId,
    status,
    storagePortId,
    storedAt,
    chartererId,
    leaseeId,
    portId,
  }: {
    id: string;
    templateId: string;
    spaceId: string;
    ownerId: string | null;
    status: string;
    storagePortId?: string | null;
    storedAt?: Date | null;
    chartererId?: string | null;
    leaseeId?: string | null;
    portId?: string | null;
  }) => {
    const template = resolveVesselTemplate(templateId);
    const port = resolvePortById(portId);
    const position = port.position;
    const now = new Date();
    const storedAtValue = status === 'stored' ? storedAt || now : null;
    return {
      id,
      spaceId,
      ownerId,
      status,
      storagePortId: storagePortId ?? port.id,
      storedAt: storedAtValue,
      chartererId: chartererId ?? null,
      leaseeId: leaseeId ?? null,
      templateId: template.id,
      mode: 'ai',
      desiredMode: 'player',
      lastCrewAt: now,
      lat: position.lat,
      lon: position.lon,
      z: position.z,
      heading: 0,
      roll: 0,
      pitch: 0,
      surge: 0,
      sway: 0,
      heave: 0,
      throttle: 0,
      rudderAngle: 0,
      ballast: 0.5,
      bowThruster: 0,
      yawRate: 0,
      mass: template.properties.mass,
      length: template.properties.length,
      beam: template.properties.beam,
      draft: template.properties.draft,
      lastUpdate: now,
      isAi: true,
      hullIntegrity: 1,
      engineHealth: 1,
      steeringHealth: 1,
      electricalHealth: 1,
      floodingDamage: 0,
    };
  };

  router.get(
    '/economy/summary',
    requireAuth,
    requirePermission('economy', 'read'),
    async (req, res) => {
      const user = requireUser(req, res);
      if (!user) return;
      try {
        const profile = await getEconomyProfile(user.userId);
        const transactions = await prisma.economyTransaction.findMany({
          where: { userId: user.userId },
          orderBy: { createdAt: 'desc' },
          take: 20,
        });
        res.json({ profile, transactions });
      } catch (err) {
        console.error('Failed to load economy summary', err);
        res.status(500).json({ error: 'Failed to load economy summary' });
      }
    },
  );

  const toVesselPosition = (vessel: { lat: number; lon: number; z: number }) =>
    positionFromLatLon({ lat: vessel.lat, lon: vessel.lon, z: vessel.z });

  const loadUserFleet = async (userId: string) =>
    prisma.vessel.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { leaseeId: userId },
          { chartererId: userId },
        ],
      },
      orderBy: { lastUpdate: 'desc' },
    });

  router.get(
    '/economy/dashboard',
    requireAuth,
    requirePermission('economy', 'read'),
    async (req, res) => {
      const user = requireUser(req, res);
      if (!user) return;
      try {
        const profile = await getEconomyProfile(user.userId);
        const fleet = await loadUserFleet(user.userId);
        const currentPort =
          fleet.length > 0
            ? resolvePortForPosition(toVesselPosition(fleet[0]))
            : null;
        const congestion = await getPortCongestion();
        const congestionMap = new Map(
          congestion.map(item => [item.portId, item.congestion]),
        );
        const ports = await Promise.all(
          ECONOMY_PORTS.map(async port => {
            const listed = await prisma.cargoLot.count({
              where: { portId: port.id, status: 'listed' },
            });
            const pax = await prisma.passengerContract.count({
              where: { originPortId: port.id, status: 'listed' },
            });
            return {
              ...port,
              listedCargo: listed,
              listedPassengers: pax,
              congestion: congestionMap.get(port.id) ?? 0,
            };
          }),
        );
        const loans = await prisma.loan.findMany({
          where: { userId: user.userId },
          orderBy: { createdAt: 'desc' },
        });
        const insurance = await prisma.insurancePolicy.findMany({
          where: { ownerId: user.userId },
          orderBy: { createdAt: 'desc' },
        });
        const leases = await prisma.vesselLease.findMany({
          where: {
            OR: [{ ownerId: user.userId }, { lesseeId: user.userId }],
          },
          orderBy: { createdAt: 'desc' },
        });
        const sales = await prisma.vesselSale.findMany({
          where: {
            OR: [{ sellerId: user.userId }, { buyerId: user.userId }],
          },
          orderBy: { createdAt: 'desc' },
        });
        const passengerContracts = await prisma.passengerContract.findMany({
          where: {
            OR: [{ operatorId: user.userId }, { status: 'listed' }],
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        });
        const missions = await prisma.mission.findMany({
          where: { spaceId: user.spaceId ?? 'global', active: true },
          orderBy: { rewardCredits: 'desc' },
          take: 10,
        });

        res.json({
          profile,
          currentPort,
          ports,
          fleet,
          loans,
          insurance,
          leases,
          sales,
          passengerContracts,
          missions,
        });
      } catch (err) {
        console.error('Failed to load economy dashboard', err);
        res.status(500).json({ error: 'Failed to load economy dashboard' });
      }
    },
  );

  router.get(
    '/economy/ports',
    requireAuth,
    requirePermission('economy', 'read'),
    async (_req, res) => {
      try {
        const congestion = await getPortCongestion();
        const congestionMap = new Map(
          congestion.map(item => [item.portId, item.congestion]),
        );
        const ports = await Promise.all(
          ECONOMY_PORTS.map(async port => {
            const listed = await prisma.cargoLot.count({
              where: { portId: port.id, status: 'listed' },
            });
            const pax = await prisma.passengerContract.count({
              where: { originPortId: port.id, status: 'listed' },
            });
            return {
              ...port,
              listedCargo: listed,
              listedPassengers: pax,
              congestion: congestionMap.get(port.id) ?? 0,
            };
          }),
        );
        res.json({ ports });
      } catch (err) {
        console.error('Failed to load ports', err);
        res.status(500).json({ error: 'Failed to load ports' });
      }
    },
  );

  router.get('/economy/vessels/catalog', requireAuth, async (_req, res) => {
    try {
      await warmVesselCatalog();
      const { entries } = getVesselCatalog();
      const vessels = entries.map(entry => ({
        ...entry,
        capacities: {
          cargoTons: estimateCargoCapacityTons(entry.properties.mass),
          passengers: estimatePassengerCapacity(entry.properties.length),
        },
      }));
      res.json({ vessels });
    } catch (err) {
      console.error('Failed to load vessel catalog', err);
      res.status(500).json({ error: 'Failed to load vessel catalog' });
    }
  });

  router.post('/economy/vessels/purchase', requireAuth, async (req, res) => {
    const actor = requireUser(req, res);
    if (!actor) return;
    try {
      const body = asRecord(req.body as unknown);
      const templateId = readString(body, 'templateId');
      const portId = readString(body, 'portId') ?? null;
      const spaceId = readString(body, 'spaceId') ?? 'global';
      if (templateId === undefined || templateId.length === 0) {
        res.status(400).json({ error: 'Missing vessel template' });
        return;
      }
      await warmVesselCatalog();
      const catalog = getVesselCatalog();
      const template = catalog.byId.get(templateId);
      if (!template) {
        res.status(404).json({ error: 'Unknown vessel template' });
        return;
      }
      const price = template.commerce?.purchasePrice ?? 0;
      if (price <= 0) {
        res.status(400).json({ error: 'Vessel not available for purchase' });
        return;
      }
      const userRecord = await prisma.user.findUnique({
        where: { id: actor.userId },
        select: { credits: true, rank: true },
      });
      if ((userRecord?.rank ?? 1) < (template.commerce?.minRank ?? 1)) {
        res.status(403).json({ error: 'Rank too low for this vessel' });
        return;
      }
      if ((userRecord?.credits ?? 0) < price) {
        res.status(400).json({ error: 'Insufficient credits' });
        return;
      }
      const vesselId = randomUUID();
      const vesselData = buildVesselCreateData({
        id: vesselId,
        templateId: template.id,
        spaceId,
        ownerId: actor.userId,
        status: 'stored',
        storagePortId: portId,
        portId,
      });
      await prisma.$transaction(async tx => {
        const txClient = tx as unknown as typeof prisma;
        await txClient.user.update({
          where: { id: actor.userId },
          data: { credits: { decrement: price } },
        });
        await txClient.vessel.create({ data: vesselData });
      });
      res.json({ vesselId, templateId: template.id });
    } catch (err) {
      console.error('Failed to purchase vessel', err);
      res.status(500).json({ error: 'Failed to purchase vessel' });
    }
  });

  router.post('/economy/vessels/lease', requireAuth, async (req, res) => {
    const actor = requireUser(req, res);
    if (!actor) return;
    try {
      const body = asRecord(req.body as unknown);
      const templateId = readString(body, 'templateId');
      const leaseType =
        readString(body, 'type') === 'lease' ? 'lease' : 'charter';
      const portId = readString(body, 'portId') ?? null;
      const spaceId = readString(body, 'spaceId') ?? 'global';
      const requestedTerm = readNumber(body, 'termHours');
      const termHours = Math.min(
        Math.max(
          1,
          requestedTerm ??
            (leaseType === 'lease'
              ? DEFAULT_LEASE_TERM_HOURS
              : DEFAULT_CHARTER_TERM_HOURS),
        ),
        MAX_TERM_HOURS,
      );
      if (templateId === undefined || templateId.length === 0) {
        res.status(400).json({ error: 'Missing vessel template' });
        return;
      }
      await warmVesselCatalog();
      const catalog = getVesselCatalog();
      const template = catalog.byId.get(templateId);
      if (!template) {
        res.status(404).json({ error: 'Unknown vessel template' });
        return;
      }
      const rate =
        leaseType === 'lease'
          ? template.commerce?.leaseRatePerHour
          : template.commerce?.charterRatePerHour;
      if (rate === undefined || rate <= 0) {
        res.status(400).json({ error: 'Vessel not available for lease' });
        return;
      }
      const userRecord = await prisma.user.findUnique({
        where: { id: actor.userId },
        select: { rank: true },
      });
      if ((userRecord?.rank ?? 1) < (template.commerce?.minRank ?? 1)) {
        res.status(403).json({ error: 'Rank too low for this vessel' });
        return;
      }
      const shipyard = await ensureShipyardUser();
      const vesselId = randomUUID();
      const vesselData = buildVesselCreateData({
        id: vesselId,
        templateId: template.id,
        spaceId,
        ownerId: shipyard.id,
        status: leaseType === 'lease' ? 'leased' : 'chartered',
        storagePortId: portId,
        portId,
        chartererId: leaseType === 'charter' ? actor.userId : null,
        leaseeId: leaseType === 'lease' ? actor.userId : null,
      });
      const lease = await prisma.$transaction(async tx => {
        const txClient = tx as unknown as typeof prisma;
        await txClient.vessel.create({ data: vesselData });
        return txClient.vesselLease.create({
          data: {
            vesselId,
            ownerId: shipyard.id,
            lesseeId: actor.userId,
            type: leaseType,
            ratePerHour: rate,
            revenueShare:
              leaseType === 'lease'
                ? (template.commerce?.revenueShare ?? 0)
                : 0,
            status: 'active',
            startedAt: new Date(),
            endsAt: new Date(Date.now() + termHours * 60 * 60 * 1000),
          },
        });
      });
      res.json({ leaseId: lease.id, vesselId, templateId: template.id });
    } catch (err) {
      console.error('Failed to create lease', err);
      res.status(500).json({ error: 'Failed to create lease' });
    }
  });

  router.get(
    '/economy/cargo',
    requireAuth,
    requirePermission('economy', 'read'),
    async (req, res) => {
      try {
        const portId =
          typeof req.query.portId === 'string' ? req.query.portId : undefined;
        const vesselId =
          typeof req.query.vesselId === 'string'
            ? req.query.vesselId
            : undefined;
        const where =
          portId !== undefined ? { portId, status: 'listed' } : undefined;
        const cargo = await prisma.cargoLot.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: 50,
        });
        if (vesselId !== undefined) {
          const vessel = await prisma.vessel.findUnique({
            where: { id: vesselId },
          });
          if (vessel) {
            const loaded = await prisma.cargoLot.aggregate({
              where: { vesselId, status: 'loaded' },
              _sum: { weightTons: true },
            });
            const capacityTons = getVesselCargoCapacityTons({
              id: vessel.id,
              spaceId: vessel.spaceId,
              ownerId: vessel.ownerId ?? null,
              status: vessel.status,
              storagePortId: vessel.storagePortId ?? null,
              storedAt:
                vessel.storedAt !== null ? vessel.storedAt.getTime() : null,
              chartererId: vessel.chartererId ?? null,
              leaseeId: vessel.leaseeId ?? null,
              crewIds: new Set<string>(),
              crewNames: new Map<string, string>(),
              mode: vessel.mode as 'player' | 'ai',
              desiredMode: vessel.desiredMode as 'player' | 'ai',
              lastCrewAt: vessel.lastCrewAt.getTime(),
              position: toVesselPosition(vessel),
              orientation: {
                heading: vessel.heading,
                roll: vessel.roll,
                pitch: vessel.pitch,
              },
              velocity: {
                surge: vessel.surge,
                sway: vessel.sway,
                heave: vessel.heave,
              },
              properties: {
                mass: vessel.mass,
                length: vessel.length,
                beam: vessel.beam,
                draft: vessel.draft,
              },
              controls: {
                throttle: vessel.throttle,
                rudderAngle: vessel.rudderAngle,
                ballast: vessel.ballast,
                bowThruster: vessel.bowThruster,
              },
              lastUpdate: vessel.lastUpdate.getTime(),
            });
            res.json({
              cargo,
              capacityTons,
              loadedTons: loaded._sum.weightTons ?? 0,
            });
            return;
          }
        }
        res.json({ cargo });
      } catch (err) {
        console.error('Failed to load cargo', err);
        res.status(500).json({ error: 'Failed to load cargo' });
      }
    },
  );

  router.post('/economy/cargo/assign', requireAuth, async (req, res) => {
    const user = requireUser(req, res);
    if (!user) return;
    try {
      const body = asRecord(req.body as unknown);
      const cargoId = readString(body, 'cargoId');
      const vesselId = readString(body, 'vesselId');
      if (
        cargoId === undefined ||
        cargoId.length === 0 ||
        vesselId === undefined ||
        vesselId.length === 0
      ) {
        res.status(400).json({ error: 'Missing cargo or vessel id' });
        return;
      }
      const cargo = await prisma.cargoLot.findUnique({
        where: { id: cargoId },
      });
      if (!cargo || (cargo.ownerId !== null && cargo.ownerId !== user.userId)) {
        res.status(404).json({ error: 'Cargo not found' });
        return;
      }
      if (cargo.status !== 'listed') {
        res.status(400).json({ error: 'Cargo not available' });
        return;
      }
      if (cargo.expiresAt && cargo.expiresAt.getTime() < Date.now()) {
        res.status(400).json({ error: 'Cargo offer expired' });
        return;
      }
      const vessel = await prisma.vessel.findUnique({
        where: { id: vesselId },
      });
      if (!vessel) {
        res.status(404).json({ error: 'Vessel not found' });
        return;
      }
      const port = resolvePortForPosition(toVesselPosition(vessel));
      if (!port || (cargo.portId !== null && cargo.portId !== port.id)) {
        res.status(400).json({ error: 'Vessel must be in the cargo port' });
        return;
      }
      const loaded = await prisma.cargoLot.aggregate({
        where: { vesselId, status: { in: ['loaded', 'loading'] } },
        _sum: { weightTons: true },
      });
      const capacityTons = getVesselCargoCapacityTons({
        id: vessel.id,
        spaceId: vessel.spaceId,
        ownerId: vessel.ownerId ?? null,
        status: vessel.status,
        storagePortId: vessel.storagePortId ?? null,
        storedAt: vessel.storedAt !== null ? vessel.storedAt.getTime() : null,
        chartererId: vessel.chartererId ?? null,
        leaseeId: vessel.leaseeId ?? null,
        crewIds: new Set<string>(),
        crewNames: new Map<string, string>(),
        mode: vessel.mode as 'player' | 'ai',
        desiredMode: vessel.desiredMode as 'player' | 'ai',
        lastCrewAt: vessel.lastCrewAt.getTime(),
        position: toVesselPosition(vessel),
        orientation: {
          heading: vessel.heading,
          roll: vessel.roll,
          pitch: vessel.pitch,
        },
        velocity: {
          surge: vessel.surge,
          sway: vessel.sway,
          heave: vessel.heave,
        },
        properties: {
          mass: vessel.mass,
          length: vessel.length,
          beam: vessel.beam,
          draft: vessel.draft,
        },
        controls: {
          throttle: vessel.throttle,
          rudderAngle: vessel.rudderAngle,
          ballast: vessel.ballast,
          bowThruster: vessel.bowThruster,
        },
        lastUpdate: vessel.lastUpdate.getTime(),
      });
      const currentWeight = loaded._sum.weightTons ?? 0;
      if (currentWeight + cargo.weightTons > capacityTons) {
        res.status(400).json({ error: 'Cargo exceeds vessel capacity' });
        return;
      }
      const congestion = await getPortCongestion();
      const portCongestion =
        congestion.find(item => item.portId === port.id)?.congestion ?? 0;
      const readyAt = new Date(
        Date.now() + computeTurnaroundDelayMs(portCongestion),
      );
      await prisma.cargoLot.update({
        where: { id: cargo.id },
        data: {
          vesselId,
          carrierId: user.userId,
          status: 'loading',
          readyAt,
          portId: null,
        },
      });
      res.json({ ok: true });
    } catch (err) {
      console.error('Failed to assign cargo', err);
      res.status(500).json({ error: 'Failed to assign cargo' });
    }
  });

  router.post('/economy/cargo/release', requireAuth, async (req, res) => {
    const user = requireUser(req, res);
    if (!user) return;
    try {
      const body = asRecord(req.body as unknown);
      const cargoId = readString(body, 'cargoId');
      if (cargoId === undefined || cargoId.length === 0) {
        res.status(400).json({ error: 'Missing cargo id' });
        return;
      }
      const cargo = await prisma.cargoLot.findUnique({
        where: { id: cargoId },
      });
      if (!cargo || (cargo.ownerId !== null && cargo.ownerId !== user.userId)) {
        res.status(404).json({ error: 'Cargo not found' });
        return;
      }
      await prisma.cargoLot.update({
        where: { id: cargo.id },
        data: { vesselId: null, status: 'delivered', portId: null },
      });
      res.json({ ok: true });
    } catch (err) {
      console.error('Failed to release cargo', err);
      res.status(500).json({ error: 'Failed to release cargo' });
    }
  });

  router.get('/economy/passengers', requireAuth, async (req, res) => {
    try {
      const portId =
        typeof req.query.portId === 'string' ? req.query.portId : undefined;
      const vesselId =
        typeof req.query.vesselId === 'string' ? req.query.vesselId : undefined;
      const where =
        portId !== undefined
          ? { originPortId: portId, status: 'listed' }
          : undefined;
      const contracts = await prisma.passengerContract.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      if (vesselId !== undefined) {
        const vessel = await prisma.vessel.findUnique({
          where: { id: vesselId },
        });
        if (vessel) {
          const onboard = await prisma.passengerContract.aggregate({
            where: { vesselId, status: 'in_progress' },
            _sum: { paxCount: true },
          });
          const capacity = getVesselPassengerCapacity({
            id: vessel.id,
            spaceId: vessel.spaceId,
            ownerId: vessel.ownerId ?? null,
            status: vessel.status,
            storagePortId: vessel.storagePortId ?? null,
            storedAt:
              vessel.storedAt !== null ? vessel.storedAt.getTime() : null,
            chartererId: vessel.chartererId ?? null,
            leaseeId: vessel.leaseeId ?? null,
            crewIds: new Set<string>(),
            crewNames: new Map<string, string>(),
            mode: vessel.mode as 'player' | 'ai',
            desiredMode: vessel.desiredMode as 'player' | 'ai',
            lastCrewAt: vessel.lastCrewAt.getTime(),
            position: toVesselPosition(vessel),
            orientation: {
              heading: vessel.heading,
              roll: vessel.roll,
              pitch: vessel.pitch,
            },
            velocity: {
              surge: vessel.surge,
              sway: vessel.sway,
              heave: vessel.heave,
            },
            properties: {
              mass: vessel.mass,
              length: vessel.length,
              beam: vessel.beam,
              draft: vessel.draft,
            },
            controls: {
              throttle: vessel.throttle,
              rudderAngle: vessel.rudderAngle,
              ballast: vessel.ballast,
              bowThruster: vessel.bowThruster,
            },
            lastUpdate: vessel.lastUpdate.getTime(),
          });
          res.json({
            contracts,
            capacity,
            onboard: onboard._sum.paxCount ?? 0,
          });
          return;
        }
      }
      res.json({ contracts });
    } catch (err) {
      console.error('Failed to load passenger contracts', err);
      res.status(500).json({ error: 'Failed to load passenger contracts' });
    }
  });

  router.post('/economy/passengers/accept', requireAuth, async (req, res) => {
    const user = requireUser(req, res);
    if (!user) return;
    try {
      const body = asRecord(req.body as unknown);
      const contractId = readString(body, 'contractId');
      const vesselId = readString(body, 'vesselId');
      if (
        contractId === undefined ||
        contractId.length === 0 ||
        vesselId === undefined ||
        vesselId.length === 0
      ) {
        res.status(400).json({ error: 'Missing contract or vessel id' });
        return;
      }
      const contract = await prisma.passengerContract.findUnique({
        where: { id: contractId },
      });
      if (!contract || contract.status !== 'listed') {
        res.status(404).json({ error: 'Passenger contract not available' });
        return;
      }
      if (contract.expiresAt && contract.expiresAt.getTime() < Date.now()) {
        res.status(400).json({ error: 'Passenger contract expired' });
        return;
      }
      const vessel = await prisma.vessel.findUnique({
        where: { id: vesselId },
      });
      if (!vessel) {
        res.status(404).json({ error: 'Vessel not found' });
        return;
      }
      const port = resolvePortForPosition(toVesselPosition(vessel));
      if (!port || port.id !== contract.originPortId) {
        res.status(400).json({ error: 'Vessel must be at the origin port' });
        return;
      }
      const onboard = await prisma.passengerContract.aggregate({
        where: { vesselId, status: { in: ['in_progress', 'boarding'] } },
        _sum: { paxCount: true },
      });
      const capacity = getVesselPassengerCapacity({
        id: vessel.id,
        spaceId: vessel.spaceId,
        ownerId: vessel.ownerId ?? null,
        status: vessel.status,
        storagePortId: vessel.storagePortId ?? null,
        storedAt: vessel.storedAt !== null ? vessel.storedAt.getTime() : null,
        chartererId: vessel.chartererId ?? null,
        leaseeId: vessel.leaseeId ?? null,
        crewIds: new Set<string>(),
        crewNames: new Map<string, string>(),
        mode: vessel.mode as 'player' | 'ai',
        desiredMode: vessel.desiredMode as 'player' | 'ai',
        lastCrewAt: vessel.lastCrewAt.getTime(),
        position: toVesselPosition(vessel),
        orientation: {
          heading: vessel.heading,
          roll: vessel.roll,
          pitch: vessel.pitch,
        },
        velocity: {
          surge: vessel.surge,
          sway: vessel.sway,
          heave: vessel.heave,
        },
        properties: {
          mass: vessel.mass,
          length: vessel.length,
          beam: vessel.beam,
          draft: vessel.draft,
        },
        controls: {
          throttle: vessel.throttle,
          rudderAngle: vessel.rudderAngle,
          ballast: vessel.ballast,
          bowThruster: vessel.bowThruster,
        },
        lastUpdate: vessel.lastUpdate.getTime(),
      });
      const current = onboard._sum.paxCount ?? 0;
      if (current + contract.paxCount > capacity) {
        res.status(400).json({ error: 'Passenger load exceeds capacity' });
        return;
      }
      const congestion = await getPortCongestion();
      const portCongestion =
        congestion.find(item => item.portId === port.id)?.congestion ?? 0;
      const readyAt = new Date(
        Date.now() + computeTurnaroundDelayMs(portCongestion),
      );
      const updated = await prisma.passengerContract.update({
        where: { id: contract.id },
        data: {
          vesselId,
          operatorId: user.userId,
          status: 'boarding',
          readyAt,
        },
      });
      res.json({ contract: updated });
    } catch (err) {
      console.error('Failed to accept passenger contract', err);
      res.status(500).json({ error: 'Failed to accept passenger contract' });
    }
  });

  router.get('/economy/fleet', requireAuth, async (req, res) => {
    const user = requireUser(req, res);
    if (!user) return;
    try {
      const fleet = await loadUserFleet(user.userId);
      res.json({ fleet });
    } catch (err) {
      console.error('Failed to load fleet', err);
      res.status(500).json({ error: 'Failed to load fleet' });
    }
  });

  router.get('/economy/loans', requireAuth, async (req, res) => {
    const user = requireUser(req, res);
    if (!user) return;
    try {
      const loans = await prisma.loan.findMany({
        where: { userId: user.userId },
        orderBy: { createdAt: 'desc' },
      });
      res.json({ loans });
    } catch (err) {
      console.error('Failed to load loans', err);
      res.status(500).json({ error: 'Failed to load loans' });
    }
  });

  router.post('/economy/loans/request', requireAuth, async (req, res) => {
    const user = requireUser(req, res);
    if (!user) return;
    try {
      const body = asRecord(req.body as unknown);
      const amount = Number(readNumber(body, 'amount'));
      if (!Number.isFinite(amount) || amount <= 0) {
        res.status(400).json({ error: 'Invalid loan amount' });
        return;
      }
      const rank = Number.isFinite(user.rank) ? user.rank : 1;
      const maxLoan = 5000 + rank * 2000;
      const existing = await prisma.loan.aggregate({
        where: { userId: user.userId, status: 'active' },
        _sum: { balance: true },
      });
      const activeBalance = existing._sum.balance ?? 0;
      if (activeBalance + amount > maxLoan) {
        res
          .status(400)
          .json({ error: 'Loan request exceeds available credit' });
        return;
      }
      const termDays = (() => {
        const value = readNumber(body, 'termDays');
        return value !== undefined && value > 0 ? value : 14;
      })();
      const interestRate = (() => {
        const value = readNumber(body, 'interestRate');
        return value !== undefined && value > 0 ? value : 0.08;
      })();
      const loan = await prisma.loan.create({
        data: {
          userId: user.userId,
          principal: amount,
          balance: amount,
          interestRate,
          issuedAt: new Date(),
          dueAt: new Date(Date.now() + termDays * 24 * 60 * 60 * 1000),
        },
      });
      await prisma.user.update({
        where: { id: user.userId },
        data: { credits: { increment: amount } },
      });
      res.json({ loan });
    } catch (err) {
      console.error('Failed to issue loan', err);
      res.status(500).json({ error: 'Failed to issue loan' });
    }
  });

  router.post('/economy/loans/repay', requireAuth, async (req, res) => {
    const user = requireUser(req, res);
    if (!user) return;
    try {
      const body = asRecord(req.body as unknown);
      const loanId = readString(body, 'loanId');
      const amount = readNumber(body, 'amount');
      if (
        loanId === undefined ||
        loanId.length === 0 ||
        amount === undefined ||
        amount <= 0
      ) {
        res.status(400).json({ error: 'Invalid repayment' });
        return;
      }
      const loan = await prisma.loan.findUnique({ where: { id: loanId } });
      if (!loan || loan.userId !== user.userId) {
        res.status(404).json({ error: 'Loan not found' });
        return;
      }
      const userRecord = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { credits: true },
      });
      const available = userRecord?.credits ?? 0;
      const payAmount = Math.min(amount, loan.balance, available);
      if (payAmount <= 0) {
        res.status(400).json({ error: 'Insufficient credits' });
        return;
      }
      await prisma.user.update({
        where: { id: user.userId },
        data: { credits: { decrement: payAmount } },
      });
      const nextBalance = loan.balance - payAmount;
      await prisma.loan.update({
        where: { id: loan.id },
        data: {
          balance: nextBalance,
          status: nextBalance <= 0 ? 'paid' : loan.status,
        },
      });
      res.json({ ok: true });
    } catch (err) {
      console.error('Failed to repay loan', err);
      res.status(500).json({ error: 'Failed to repay loan' });
    }
  });

  router.get('/economy/insurance', requireAuth, async (req, res) => {
    const user = requireUser(req, res);
    if (!user) return;
    try {
      const policies = await prisma.insurancePolicy.findMany({
        where: { ownerId: user.userId },
        orderBy: { createdAt: 'desc' },
      });
      res.json({ policies });
    } catch (err) {
      console.error('Failed to load insurance policies', err);
      res.status(500).json({ error: 'Failed to load insurance policies' });
    }
  });

  router.post('/economy/insurance/purchase', requireAuth, async (req, res) => {
    const user = requireUser(req, res);
    if (!user) return;
    try {
      const body = asRecord(req.body as unknown);
      const vesselId = readString(body, 'vesselId');
      const coverage = readNumber(body, 'coverage');
      const deductible = readNumber(body, 'deductible');
      const premiumRate = readNumber(body, 'premiumRate');
      if (
        vesselId === undefined ||
        vesselId.length === 0 ||
        coverage === undefined ||
        premiumRate === undefined
      ) {
        res.status(400).json({ error: 'Invalid insurance terms' });
        return;
      }
      const vessel = await prisma.vessel.findUnique({
        where: { id: vesselId },
      });
      if (!vessel || vessel.ownerId !== user.userId) {
        res.status(403).json({ error: 'Not authorized' });
        return;
      }
      const termDays = (() => {
        const value = readNumber(body, 'termDays');
        return value !== undefined && value > 0 ? value : 30;
      })();
      const policy = await prisma.insurancePolicy.create({
        data: {
          vesselId,
          ownerId: user.userId,
          type:
            readString(body, 'type') === 'loss' ||
            readString(body, 'type') === 'salvage'
              ? (readString(body, 'type') as 'loss' | 'salvage')
              : 'damage',
          coverage,
          deductible: deductible ?? 0,
          premiumRate,
          status: 'active',
          activeFrom: new Date(),
          activeUntil: new Date(Date.now() + termDays * 24 * 60 * 60 * 1000),
          lastChargedAt: new Date(),
        },
      });
      res.json({ policy });
    } catch (err) {
      console.error('Failed to purchase insurance', err);
      res.status(500).json({ error: 'Failed to purchase insurance' });
    }
  });

  router.post('/economy/insurance/cancel', requireAuth, async (req, res) => {
    const user = requireUser(req, res);
    if (!user) return;
    try {
      const body = asRecord(req.body as unknown);
      const policyId = readString(body, 'policyId');
      if (policyId === undefined || policyId.length === 0) {
        res.status(400).json({ error: 'Missing policy id' });
        return;
      }
      const policy = await prisma.insurancePolicy.findUnique({
        where: { id: policyId },
      });
      if (!policy || policy.ownerId !== user.userId) {
        res.status(404).json({ error: 'Policy not found' });
        return;
      }
      await prisma.insurancePolicy.update({
        where: { id: policy.id },
        data: { status: 'canceled', activeUntil: new Date() },
      });
      res.json({ ok: true });
    } catch (err) {
      console.error('Failed to cancel insurance', err);
      res.status(500).json({ error: 'Failed to cancel insurance' });
    }
  });

  router.get('/economy/leases', requireAuth, async (req, res) => {
    const user = requireUser(req, res);
    if (!user) return;
    try {
      const leases = await prisma.vesselLease.findMany({
        where: {
          OR: [{ ownerId: user.userId }, { lesseeId: user.userId }],
        },
        orderBy: { createdAt: 'desc' },
      });
      res.json({ leases });
    } catch (err) {
      console.error('Failed to load leases', err);
      res.status(500).json({ error: 'Failed to load leases' });
    }
  });

  router.post('/economy/leases', requireAuth, async (req, res) => {
    const user = requireUser(req, res);
    if (!user) return;
    try {
      const body = asRecord(req.body as unknown);
      const vesselId = readString(body, 'vesselId');
      const ratePerHour = readNumber(body, 'ratePerHour');
      const endsAtRaw = readString(body, 'endsAt');
      if (vesselId === undefined || ratePerHour === undefined) {
        res.status(400).json({ error: 'Invalid lease terms' });
        return;
      }
      const vessel = await prisma.vessel.findUnique({
        where: { id: vesselId },
      });
      if (!vessel || vessel.ownerId !== user.userId) {
        res.status(403).json({ error: 'Not authorized' });
        return;
      }
      const lease = await prisma.vesselLease.create({
        data: {
          vesselId,
          ownerId: user.userId,
          type: readString(body, 'type') === 'lease' ? 'lease' : 'charter',
          ratePerHour,
          revenueShare: readNumber(body, 'revenueShare') ?? 0,
          status: 'open',
          endsAt: endsAtRaw !== undefined ? new Date(endsAtRaw) : null,
        },
      });
      res.json({ lease });
    } catch (err) {
      console.error('Failed to create lease', err);
      res.status(500).json({ error: 'Failed to create lease' });
    }
  });

  router.post('/economy/leases/accept', requireAuth, async (req, res) => {
    const user = requireUser(req, res);
    if (!user) return;
    try {
      const body = asRecord(req.body as unknown);
      const leaseId = readString(body, 'leaseId');
      if (leaseId === undefined || leaseId.length === 0) {
        res.status(400).json({ error: 'Missing lease id' });
        return;
      }
      const lease = await prisma.vesselLease.findUnique({
        where: { id: leaseId },
      });
      if (!lease || lease.status !== 'open') {
        res.status(404).json({ error: 'Lease not available' });
        return;
      }
      const updated = await prisma.vesselLease.update({
        where: { id: lease.id },
        data: {
          status: 'active',
          lesseeId: user.userId,
          startedAt: new Date(),
        },
      });
      await prisma.vessel.update({
        where: { id: updated.vesselId },
        data:
          updated.type === 'lease'
            ? { status: 'leased', leaseeId: user.userId, chartererId: null }
            : {
                status: 'chartered',
                chartererId: user.userId,
                leaseeId: null,
              },
      });
      res.json({ lease: updated });
    } catch (err) {
      console.error('Failed to accept lease', err);
      res.status(500).json({ error: 'Failed to accept lease' });
    }
  });

  router.post('/economy/leases/end', requireAuth, async (req, res) => {
    const user = requireUser(req, res);
    if (!user) return;
    try {
      const body = asRecord(req.body as unknown);
      const leaseId = readString(body, 'leaseId');
      if (leaseId === undefined || leaseId.length === 0) {
        res.status(400).json({ error: 'Missing lease id' });
        return;
      }
      const lease = await prisma.vesselLease.findUnique({
        where: { id: leaseId },
      });
      if (!lease || lease.status !== 'active') {
        res.status(404).json({ error: 'Lease not active' });
        return;
      }
      const userId = user.userId;
      const canEnd = lease.lesseeId === userId || lease.ownerId === userId;
      if (!canEnd) {
        res.status(403).json({ error: 'Not authorized to end lease' });
        return;
      }
      const vessel = await prisma.vessel.findUnique({
        where: { id: lease.vesselId },
      });
      const now = new Date();
      const position = vessel
        ? positionFromLatLon({
            lat: vessel.lat,
            lon: vessel.lon,
            z: vessel.z,
          })
        : null;
      const port = position ? resolvePortForPosition(position) : null;
      const stored = Boolean(port);
      await prisma.$transaction(async tx => {
        const txClient = tx as unknown as typeof prisma;
        await txClient.vesselLease.update({
          where: { id: lease.id },
          data: { status: 'completed', endsAt: now },
        });
        await txClient.vessel.update({
          where: { id: lease.vesselId },
          data: {
            status: stored ? 'stored' : 'active',
            storagePortId: stored ? port!.id : null,
            storedAt: stored ? now : null,
            chartererId: null,
            leaseeId: null,
            mode: 'ai',
            desiredMode: 'ai',
          },
        });
      });
      res.json({ ok: true });
    } catch (err) {
      console.error('Failed to end lease', err);
      res.status(500).json({ error: 'Failed to end lease' });
    }
  });

  router.get('/economy/sales', requireAuth, async (req, res) => {
    const user = requireUser(req, res);
    if (!user) return;
    try {
      const sales = await prisma.vesselSale.findMany({
        where: {
          OR: [{ sellerId: user.userId }, { buyerId: user.userId }],
        },
        orderBy: { createdAt: 'desc' },
      });
      res.json({ sales });
    } catch (err) {
      console.error('Failed to load sales', err);
      res.status(500).json({ error: 'Failed to load sales' });
    }
  });

  router.post('/economy/sales', requireAuth, async (req, res) => {
    const user = requireUser(req, res);
    if (!user) return;
    try {
      const body = asRecord(req.body as unknown);
      const vesselId = readString(body, 'vesselId');
      const price = readNumber(body, 'price');
      const endsAtRaw = readString(body, 'endsAt');
      if (vesselId === undefined || price === undefined) {
        res.status(400).json({ error: 'Invalid sale' });
        return;
      }
      const vessel = await prisma.vessel.findUnique({
        where: { id: vesselId },
      });
      if (!vessel || vessel.ownerId !== user.userId) {
        res.status(403).json({ error: 'Not authorized' });
        return;
      }
      const sale = await prisma.vesselSale.create({
        data: {
          vesselId,
          sellerId: user.userId,
          type: readString(body, 'type') === 'auction' ? 'auction' : 'sale',
          price,
          reservePrice: readNumber(body, 'reservePrice') ?? null,
          endsAt: endsAtRaw !== undefined ? new Date(endsAtRaw) : null,
        },
      });
      await prisma.vessel.update({
        where: { id: vesselId },
        data: { status: sale.type === 'auction' ? 'auction' : 'sale' },
      });
      res.json({ sale });
    } catch (err) {
      console.error('Failed to list vessel', err);
      res.status(500).json({ error: 'Failed to list vessel' });
    }
  });

  router.post('/economy/sales/buy', requireAuth, async (req, res) => {
    const user = requireUser(req, res);
    if (!user) return;
    try {
      const body = asRecord(req.body as unknown);
      const saleId = readString(body, 'saleId');
      if (saleId === undefined || saleId.length === 0) {
        res.status(400).json({ error: 'Missing sale id' });
        return;
      }
      const sale = await prisma.vesselSale.findUnique({
        where: { id: saleId },
      });
      if (!sale || sale.status !== 'open') {
        res.status(404).json({ error: 'Sale not available' });
        return;
      }
      if (sale.reservePrice !== null && sale.price < sale.reservePrice) {
        res.status(400).json({ error: 'Reserve not met' });
        return;
      }
      const userRecord = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { credits: true },
      });
      if ((userRecord?.credits ?? 0) < sale.price) {
        res.status(400).json({ error: 'Insufficient credits' });
        return;
      }
      await prisma.user.update({
        where: { id: user.userId },
        data: { credits: { decrement: sale.price } },
      });
      await prisma.user.update({
        where: { id: sale.sellerId },
        data: { credits: { increment: sale.price } },
      });
      await prisma.vessel.update({
        where: { id: sale.vesselId },
        data: {
          ownerId: user.userId,
          status: 'active',
          chartererId: null,
          leaseeId: null,
        },
      });
      await prisma.vesselSale.update({
        where: { id: sale.id },
        data: { status: 'sold', buyerId: user.userId, endsAt: new Date() },
      });
      res.json({ ok: true });
    } catch (err) {
      console.error('Failed to buy vessel', err);
      res.status(500).json({ error: 'Failed to buy vessel' });
    }
  });

  router.post('/economy/vessels/storage', requireAuth, async (req, res) => {
    const user = requireUser(req, res);
    if (!user) return;
    try {
      const body = asRecord(req.body as unknown);
      const vesselId = readString(body, 'vesselId');
      const action = readString(body, 'action');
      if (vesselId === undefined || vesselId.length === 0) {
        res.status(400).json({ error: 'Missing vessel id' });
        return;
      }
      const vessel = await prisma.vessel.findUnique({
        where: { id: vesselId },
      });
      const isOperator =
        vessel?.ownerId === user.userId ||
        vessel?.chartererId === user.userId ||
        vessel?.leaseeId === user.userId;
      if (!vessel || !isOperator) {
        res.status(404).json({ error: 'Vessel not found' });
        return;
      }
      if (action === 'activate') {
        await prisma.vessel.update({
          where: { id: vesselId },
          data: { status: 'active', storagePortId: null, storedAt: null },
        });
        res.json({ ok: true });
        return;
      }
      const port = resolvePortForPosition(toVesselPosition(vessel));
      if (!port) {
        res.status(400).json({ error: 'Vessel must be in port to store' });
        return;
      }
      await prisma.vessel.update({
        where: { id: vesselId },
        data: {
          status: 'stored',
          storagePortId: port.id,
          storedAt: new Date(),
        },
      });
      res.json({ ok: true });
    } catch (err) {
      console.error('Failed to store vessel', err);
      res.status(500).json({ error: 'Failed to store vessel' });
    }
  });

  router.get(
    '/economy/transactions',
    requireAuth,
    requirePermission('economy', 'read'),
    async (req, res) => {
      const user = requireUser(req, res);
      if (!user) return;
      const parsedLimit = Number(req.query.limit ?? 50);
      const limit =
        Number.isFinite(parsedLimit) && parsedLimit > 0
          ? Math.min(parsedLimit, 200)
          : 50;
      try {
        const transactions = await prisma.economyTransaction.findMany({
          where: { userId: user.userId },
          orderBy: { createdAt: 'desc' },
          take: limit,
        });
        res.json({ transactions });
      } catch (err) {
        console.error('Failed to fetch transactions', err);
        res.status(500).json({ error: 'Failed to fetch transactions' });
      }
    },
  );
};
