import { prisma } from '../../lib/prisma';
import {
  getEconomyProfile,
  applyEconomyAdjustment,
  resolvePortForPosition,
} from '../economy';
import type { SocketHandlerContext } from './context';

export function registerVesselSaleHandler(ctx: SocketHandlerContext) {
  const {
    io,
    socket,
    effectiveUserId,
    globalState,
    hasAdminRole,
    persistVesselToDb,
    defaultSpaceId,
    userSpaceKey,
    syncUserSocketsEconomy,
  } = ctx;

  socket.on('vessel:sale:create', data => {
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
        socket.emit('error', 'Not authorized to sell this vessel');
        return;
      }
      const price = Number(data?.price);
      if (!Number.isFinite(price) || price <= 0) {
        socket.emit('error', 'Invalid sale price');
        return;
      }
      const port = resolvePortForPosition(vessel.position);
      if (!port) {
        socket.emit('error', 'Vessel must be in port to list for sale');
        return;
      }
      const type = data?.type === 'auction' ? 'auction' : 'sale';
      const reservePrice =
        data?.reservePrice !== undefined
          ? Number(data.reservePrice)
          : undefined;
      const endsAt =
        data?.endsAt && Number.isFinite(data.endsAt)
          ? new Date(Number(data.endsAt))
          : null;
      await prisma.vesselSale.create({
        data: {
          vesselId: vessel.id,
          sellerId: currentUserId,
          type,
          price,
          reservePrice:
            reservePrice !== undefined && !Number.isNaN(reservePrice)
              ? reservePrice
              : null,
          endsAt,
        },
      });
      vessel.status = type === 'auction' ? 'auction' : 'sale';
      vessel.mode = 'ai';
      vessel.desiredMode = 'ai';
      vessel.crewIds.clear();
      vessel.crewNames.clear();
      vessel.helmUserId = null;
      vessel.helmUsername = null;
      vessel.engineUserId = null;
      vessel.engineUsername = null;
      vessel.radioUserId = null;
      vessel.radioUsername = null;
      vessel.lastUpdate = Date.now();
      void persistVesselToDb(vessel, { force: true });
    })().catch(err => {
      console.error('Failed to create sale', err);
      socket.emit('error', 'Unable to list vessel');
    });
  });

  socket.on('vessel:sale:buy', data => {
    const currentUserId = socket.data.userId || effectiveUserId;
    if (!currentUserId) return;
    void (async () => {
      const saleId = data?.saleId;
      if (!saleId || typeof saleId !== 'string') {
        socket.emit('error', 'Missing sale id');
        return;
      }
      const sale = await prisma.vesselSale.findUnique({
        where: { id: saleId },
      });
      if (!sale || sale.status !== 'open') {
        socket.emit('error', 'Sale not available');
        return;
      }
      if (sale.reservePrice && sale.price < sale.reservePrice) {
        socket.emit('error', 'Sale reserve not met');
        return;
      }
      const buyerProfile = await getEconomyProfile(currentUserId);
      if (buyerProfile.credits < sale.price) {
        socket.emit('error', 'Insufficient credits to purchase vessel');
        return;
      }
      const vessel = globalState.vessels.get(sale.vesselId);
      if (vessel) {
        vessel.ownerId = currentUserId;
        vessel.status = 'active';
        vessel.chartererId = null;
        vessel.leaseeId = null;
        vessel.desiredMode = 'player';
        vessel.crewIds.clear();
        vessel.crewNames.clear();
        vessel.helmUserId = null;
        vessel.helmUsername = null;
        vessel.engineUserId = null;
        vessel.engineUsername = null;
        vessel.radioUserId = null;
        vessel.radioUsername = null;
        vessel.lastUpdate = Date.now();
        globalState.userLastVessel.set(
          userSpaceKey(currentUserId, vessel.spaceId || defaultSpaceId),
          vessel.id,
        );
        void persistVesselToDb(vessel, { force: true });
      } else {
        await prisma.vessel.update({
          where: { id: sale.vesselId },
          data: {
            ownerId: currentUserId,
            status: 'active',
            chartererId: null,
            leaseeId: null,
          },
        });
      }
      await prisma.vesselSale.update({
        where: { id: sale.id },
        data: {
          status: 'sold',
          buyerId: currentUserId,
          endsAt: new Date(),
        },
      });
      const buyerNext = await applyEconomyAdjustment({
        userId: currentUserId,
        vesselId: sale.vesselId,
        deltaCredits: -sale.price,
        reason: 'vessel_purchase',
      });
      io.to(`user:${currentUserId}`).emit('economy:update', buyerNext);
      void syncUserSocketsEconomy(currentUserId, buyerNext);
      if (sale.sellerId) {
        const sellerNext = await applyEconomyAdjustment({
          userId: sale.sellerId,
          vesselId: sale.vesselId,
          deltaCredits: sale.price,
          reason: 'vessel_sale',
        });
        io.to(`user:${sale.sellerId}`).emit('economy:update', sellerNext);
        void syncUserSocketsEconomy(sale.sellerId, sellerNext);
      }
    })().catch(err => {
      console.error('Failed to complete sale', err);
      socket.emit('error', 'Unable to complete sale');
    });
  });
}
