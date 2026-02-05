import { prisma } from '../../lib/prisma';
import {
  applyEconomyAdjustment,
  calculateVesselCreationCost,
  getEconomyProfile,
} from '../economy';
import type { SocketHandlerContext } from './context';

export function registerVesselJoinHandler({
  io,
  socket,
  spaceId,
  effectiveUserId,
  effectiveUsername,
  isPlayerOrHigher,
  spaceMeta,
  globalState,
  buildVesselRecordFromRow,
  findVesselInSpace,
  findJoinableVessel,
  hasAdminRole,
  maxCrew,
  detachUserFromCurrentVessel,
  assignStationsForCrew,
  aiControllers,
  userSpaceKey,
  updateSocketVesselRoom,
  toSimpleVesselState,
  persistVesselToDb,
  defaultSpaceId,
  createNewVesselForUser,
  syncUserSocketsEconomy,
}: SocketHandlerContext) {
  socket.on('vessel:join', async data => {
    const currentUserId = socket.data.userId || effectiveUserId;
    const currentUsername = socket.data.username || effectiveUsername;
    const rankEligible =
      (socket.data.rank ?? 1) >= (spaceMeta.rankRequired ?? 1);
    if (!isPlayerOrHigher()) {
      socket.emit('error', 'Not authorized to join a vessel');
      return;
    }
    if (!rankEligible) {
      socket.emit(
        'error',
        `Rank ${spaceMeta.rankRequired ?? 1} required for this space`,
      );
      return;
    }
    const targetId =
      typeof data?.vesselId === 'string' ? data.vesselId : undefined;
    let target = targetId ? findVesselInSpace(targetId, spaceId) : null;
    if (!target && targetId) {
      const row = await prisma.vessel.findUnique({ where: { id: targetId } });
      if (!row) {
        socket.emit('error', 'Vessel not found');
        return;
      }
      const isOperator =
        row.ownerId === currentUserId ||
        row.chartererId === currentUserId ||
        row.leaseeId === currentUserId;
      if (!isOperator && !hasAdminRole(socket)) {
        socket.emit('error', 'Not authorized to join this vessel');
        return;
      }
      const hydrated = buildVesselRecordFromRow(row);
      if ((hydrated.spaceId || defaultSpaceId) !== spaceId) {
        socket.emit('error', 'Vessel not available in this space');
        return;
      }
      if (hydrated.status === 'stored' || hydrated.status === 'repossession') {
        socket.emit('error', 'Vessel is stored');
        return;
      }
      globalState.vessels.set(hydrated.id, hydrated);
      target = hydrated;
    }
    if (!target) {
      target = findJoinableVessel(currentUserId, spaceId);
    }
    if (!target) {
      socket.emit('error', 'No joinable vessels available');
      return;
    }
    if (target.crewIds.size >= maxCrew) {
      socket.emit('error', 'Selected vessel is at max crew');
      return;
    }

    detachUserFromCurrentVessel(currentUserId, spaceId);
    target.crewIds.add(currentUserId);
    target.crewNames.set(currentUserId, currentUsername);
    assignStationsForCrew(target, currentUserId, currentUsername);
    target.mode = 'player';
    aiControllers.delete(target.id);
    target.desiredMode = 'player';
    target.spaceId = spaceId;
    target.lastCrewAt = Date.now();
    target.lastUpdate = Date.now();
    globalState.userLastVessel.set(
      userSpaceKey(currentUserId, spaceId),
      target.id,
    );
    updateSocketVesselRoom(socket, spaceId, target.id);
    socket.data.mode = 'player';
    void persistVesselToDb(target, { force: true });

    io.to(`space:${spaceId}`).emit('simulation:update', {
      vessels: { [target.id]: toSimpleVesselState(target) },
      partial: true,
      timestamp: Date.now(),
    });
  });

  socket.on('vessel:create', data => {
    const currentUserId = socket.data.userId || effectiveUserId;
    const currentUsername = socket.data.username || effectiveUsername;
    const rankEligible =
      (socket.data.rank ?? 1) >= (spaceMeta.rankRequired ?? 1);
    if (!isPlayerOrHigher()) {
      socket.emit('error', 'Not authorized to create a vessel');
      return;
    }
    if (!rankEligible) {
      socket.emit(
        'error',
        `Rank ${spaceMeta.rankRequired ?? 1} required for this space`,
      );
      return;
    }
    void (async () => {
      const economyProfile = await getEconomyProfile(currentUserId);
      const creationCost = calculateVesselCreationCost(economyProfile.rank);
      if (economyProfile.credits < creationCost) {
        socket.emit(
          'error',
          `Insufficient credits for vessel creation (${creationCost} cr required)`,
        );
        return;
      }
      const updatedProfile = await applyEconomyAdjustment({
        userId: currentUserId,
        deltaCredits: -creationCost,
        reason: 'vessel_purchase',
        meta: { cost: creationCost },
      });
      io.to(`user:${currentUserId}`).emit('economy:update', updatedProfile);
      void syncUserSocketsEconomy(currentUserId, updatedProfile);

      detachUserFromCurrentVessel(currentUserId, spaceId);
      const newVessel = createNewVesselForUser(
        currentUserId,
        currentUsername,
        data || {},
        spaceId,
      );
      globalState.vessels.set(newVessel.id, newVessel);
      globalState.userLastVessel.set(
        userSpaceKey(currentUserId, spaceId),
        newVessel.id,
      );
      updateSocketVesselRoom(socket, spaceId, newVessel.id);
      socket.data.mode = 'player';
      void persistVesselToDb(newVessel, { force: true });
      io.to(`space:${spaceId}`).emit('simulation:update', {
        vessels: { [newVessel.id]: toSimpleVesselState(newVessel) },
        partial: true,
        timestamp: Date.now(),
      });
      console.info(
        `Created new vessel ${newVessel.id} for ${currentUsername} (${currentUserId})`,
      );
    })().catch(err => {
      console.error('Failed to create vessel', err);
      socket.emit('error', 'Unable to create vessel');
    });
  });
}
