import { prisma } from '../../lib/prisma';
import type { SocketHandlerContext } from './context';

export function registerVesselLeaseHandler({
  socket,
  effectiveUserId,
  globalState,
  hasAdminRole,
  persistVesselToDb,
}: SocketHandlerContext) {
  socket.on('vessel:lease:create', data => {
    const currentUserId = socket.data.userId || effectiveUserId;
    if (!currentUserId) return;
    void (async () => {
      const vesselId = data?.vesselId;
      if (!vesselId || typeof vesselId !== 'string') {
        socket.emit('error', 'Missing vessel id');
        return;
      }
      const vessel = globalState.vessels.get(vesselId);
      if (!vessel) {
        socket.emit('error', 'Vessel not found');
        return;
      }
      const isAdmin = hasAdminRole(socket);
      const isOwner = vessel.ownerId === currentUserId;
      if (!isOwner && !isAdmin) {
        socket.emit('error', 'Not authorized to lease this vessel');
        return;
      }
      const ratePerHour = Number(data?.ratePerHour);
      if (!Number.isFinite(ratePerHour) || ratePerHour <= 0) {
        socket.emit('error', 'Invalid lease rate');
        return;
      }
      const revenueShare =
        data?.revenueShare !== undefined ? Number(data.revenueShare) : 0;
      const leaseType = data?.type === 'lease' ? 'lease' : 'charter';
      const endsAt =
        data?.endsAt && Number.isFinite(data.endsAt)
          ? new Date(Number(data.endsAt))
          : null;
      await prisma.vesselLease.create({
        data: {
          vesselId: vessel.id,
          ownerId: currentUserId,
          type: leaseType,
          ratePerHour,
          revenueShare:
            Number.isFinite(revenueShare) && revenueShare > 0
              ? revenueShare
              : 0,
          status: 'open',
          endsAt,
        },
      });
    })().catch(err => {
      console.error('Failed to create lease', err);
      socket.emit('error', 'Unable to create lease');
    });
  });

  socket.on('vessel:lease:accept', data => {
    const currentUserId = socket.data.userId || effectiveUserId;
    if (!currentUserId) return;
    void (async () => {
      const leaseId = data?.leaseId;
      if (!leaseId || typeof leaseId !== 'string') {
        socket.emit('error', 'Missing lease id');
        return;
      }
      const lease = await prisma.vesselLease.findUnique({
        where: { id: leaseId },
      });
      if (!lease || lease.status !== 'open') {
        socket.emit('error', 'Lease not available');
        return;
      }
      const updated = await prisma.vesselLease.update({
        where: { id: lease.id },
        data: {
          status: 'active',
          lesseeId: currentUserId,
          startedAt: new Date(),
        },
      });
      const vessel = globalState.vessels.get(updated.vesselId);
      if (vessel) {
        if (updated.type === 'lease') {
          vessel.leaseeId = currentUserId;
          vessel.chartererId = null;
          vessel.status = 'leased';
        } else {
          vessel.chartererId = currentUserId;
          vessel.leaseeId = null;
          vessel.status = 'chartered';
        }
        vessel.desiredMode = 'player';
        vessel.lastUpdate = Date.now();
        void persistVesselToDb(vessel, { force: true });
      } else {
        await prisma.vessel.update({
          where: { id: updated.vesselId },
          data:
            updated.type === 'lease'
              ? {
                  status: 'leased',
                  leaseeId: currentUserId,
                  chartererId: null,
                }
              : {
                  status: 'chartered',
                  chartererId: currentUserId,
                  leaseeId: null,
                },
        });
      }
    })().catch(err => {
      console.error('Failed to accept lease', err);
      socket.emit('error', 'Unable to accept lease');
    });
  });
}
