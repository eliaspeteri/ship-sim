import { prisma } from '../../lib/prisma';
import { computeTurnaroundDelayMs, getPortCongestion } from '../logistics';
import { getVesselCargoCapacityTons, resolvePortForPosition } from '../economy';
import type { SocketHandlerContext } from './context';

export function registerCargoHandlers({
  socket,
  effectiveUserId,
  globalState,
  hasAdminRole,
}: SocketHandlerContext) {
  socket.on('cargo:create', data => {
    const currentUserId = effectiveUserId;
    void (async () => {
      const value = Number(data.value);
      if (!Number.isFinite(value) || value <= 0) {
        socket.emit('error', 'Invalid cargo value');
        return;
      }
      const weightTons = Number(data.weightTons ?? 0);
      if (!Number.isFinite(weightTons) || weightTons < 0) {
        socket.emit('error', 'Invalid cargo weight');
        return;
      }
      const rewardCredits = Number(data.rewardCredits ?? value);
      if (!Number.isFinite(rewardCredits) || rewardCredits <= 0) {
        socket.emit('error', 'Invalid cargo reward');
        return;
      }
      const vesselId =
        typeof data.vesselId === 'string' && data.vesselId.length > 0
          ? data.vesselId
          : null;
      let portId =
        typeof data.portId === 'string' && data.portId.length > 0
          ? data.portId
          : null;
      let originPortId =
        typeof data.originPortId === 'string' && data.originPortId.length > 0
          ? data.originPortId
          : null;
      const destinationPortId =
        typeof data.destinationPortId === 'string' &&
        data.destinationPortId.length > 0
          ? data.destinationPortId
          : null;
      if (vesselId !== null && vesselId.length > 0) {
        const vessel = globalState.vessels.get(vesselId);
        if (!vessel) {
          socket.emit('error', 'Vessel not found');
          return;
        }
        const isAdmin = hasAdminRole(socket);
        const isOwner = vessel.ownerId === currentUserId;
        if (!isOwner && !isAdmin) {
          socket.emit('error', 'Not authorized to load cargo');
          return;
        }
        const port = resolvePortForPosition(vessel.position);
        if (!port) {
          socket.emit('error', 'Vessel must be in port to load cargo');
          return;
        }
        portId = port.id;
        originPortId = port.id;
      }
      if (vesselId === null && portId === null) {
        socket.emit('error', 'Missing port for cargo listing');
        return;
      }
      const cargoType =
        typeof data.cargoType === 'string' ? data.cargoType : 'bulk';
      const expiresAt =
        Number.isFinite(data.expiresAt) && Number(data.expiresAt) > 0
          ? new Date(Number(data.expiresAt))
          : null;
      const liabilityRate =
        data.liabilityRate !== undefined ? Number(data.liabilityRate) : 0;
      await prisma.cargoLot.create({
        data: {
          ownerId: currentUserId,
          carrierId: vesselId !== null ? currentUserId : null,
          vesselId,
          portId,
          originPortId,
          destinationPortId,
          description:
            typeof data.description === 'string' ? data.description : null,
          cargoType,
          value,
          rewardCredits,
          weightTons,
          liabilityRate:
            Number.isFinite(liabilityRate) && liabilityRate > 0
              ? liabilityRate
              : 0,
          expiresAt,
          status: vesselId !== null ? 'loaded' : 'listed',
        },
      });
    })().catch(err => {
      console.error('Failed to create cargo', err);
      socket.emit('error', 'Unable to create cargo');
    });
  });

  socket.on('cargo:assign', data => {
    const currentUserId = effectiveUserId;
    void (async () => {
      const cargoId = data.cargoId;
      const vesselId = data.vesselId;
      if (
        typeof cargoId !== 'string' ||
        cargoId.length === 0 ||
        typeof vesselId !== 'string' ||
        vesselId.length === 0
      ) {
        socket.emit('error', 'Missing cargo or vessel id');
        return;
      }
      const cargo = await prisma.cargoLot.findUnique({
        where: { id: cargoId },
      });
      if (
        !cargo ||
        (cargo.ownerId !== null &&
          cargo.ownerId.length > 0 &&
          cargo.ownerId !== currentUserId)
      ) {
        socket.emit('error', 'Cargo not found');
        return;
      }
      if (cargo.status !== 'listed') {
        socket.emit('error', 'Cargo not available');
        return;
      }
      if (cargo.expiresAt !== null && cargo.expiresAt.getTime() < Date.now()) {
        socket.emit('error', 'Cargo offer expired');
        return;
      }
      const vessel = globalState.vessels.get(vesselId);
      if (!vessel) {
        socket.emit('error', 'Vessel not found');
        return;
      }
      const port = resolvePortForPosition(vessel.position);
      if (
        !port ||
        (cargo.portId !== null &&
          cargo.portId.length > 0 &&
          cargo.portId !== port.id)
      ) {
        socket.emit('error', 'Vessel must be in the cargo port');
        return;
      }
      const loadedCargo = await prisma.cargoLot.aggregate({
        where: { vesselId, status: { in: ['loaded', 'loading'] } },
        _sum: { weightTons: true },
      });
      const currentWeight = loadedCargo._sum.weightTons ?? 0;
      const capacityTons = getVesselCargoCapacityTons(vessel);
      if (currentWeight + cargo.weightTons > capacityTons) {
        socket.emit('error', 'Cargo exceeds vessel capacity');
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
          carrierId: currentUserId,
          status: 'loading',
          readyAt,
          portId: null,
        },
      });
    })().catch(err => {
      console.error('Failed to assign cargo', err);
      socket.emit('error', 'Unable to assign cargo');
    });
  });

  socket.on('cargo:release', data => {
    const currentUserId = effectiveUserId;
    void (async () => {
      const cargoId = data.cargoId;
      if (typeof cargoId !== 'string' || cargoId.length === 0) {
        socket.emit('error', 'Missing cargo id');
        return;
      }
      const cargo = await prisma.cargoLot.findUnique({
        where: { id: cargoId },
      });
      if (!cargo || cargo.ownerId !== currentUserId) {
        socket.emit('error', 'Cargo not found');
        return;
      }
      await prisma.cargoLot.update({
        where: { id: cargo.id },
        data: { vesselId: null, status: 'delivered', portId: null },
      });
    })().catch(err => {
      console.error('Failed to release cargo', err);
      socket.emit('error', 'Unable to release cargo');
    });
  });
}
