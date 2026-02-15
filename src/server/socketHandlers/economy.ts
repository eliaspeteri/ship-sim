import { prisma } from '../../lib/prisma';
import { applyEconomyAdjustment, getEconomyProfile } from '../economy';
import type { SocketHandlerContext } from './context';

export function registerEconomyHandlers({
  io,
  socket,
  effectiveUserId,
  globalState,
  syncUserSocketsEconomy,
}: SocketHandlerContext) {
  socket.on('economy:loan:request', data => {
    const currentUserId = effectiveUserId;
    void (async () => {
      const amount = Number(data.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        socket.emit('error', 'Invalid loan amount');
        return;
      }
      const rank = socket.data.rank;
      const maxLoan = 5000 + rank * 2000;
      const existing = await prisma.loan.aggregate({
        where: { userId: currentUserId, status: 'active' },
        _sum: { balance: true },
      });
      const activeBalance = existing._sum.balance ?? 0;
      if (activeBalance + amount > maxLoan) {
        socket.emit('error', 'Loan request exceeds available credit');
        return;
      }
      const termDays =
        Number.isFinite(data.termDays) && Number(data.termDays) > 0
          ? Number(data.termDays)
          : 14;
      const interestRate =
        Number.isFinite(data.interestRate) && Number(data.interestRate) > 0
          ? Number(data.interestRate)
          : 0.08;
      const loan = await prisma.loan.create({
        data: {
          userId: currentUserId,
          principal: amount,
          balance: amount,
          interestRate,
          issuedAt: new Date(),
          dueAt: new Date(Date.now() + termDays * 24 * 60 * 60 * 1000),
        },
      });
      const profile = await applyEconomyAdjustment({
        userId: currentUserId,
        deltaCredits: amount,
        reason: 'loan_disbursement',
        meta: { loanId: loan.id },
      });
      io.to(`user:${currentUserId}`).emit('economy:update', profile);
      void syncUserSocketsEconomy(currentUserId, profile);
    })().catch(err => {
      console.error('Failed to issue loan', err);
      socket.emit('error', 'Unable to issue loan');
    });
  });

  socket.on('economy:loan:repay', data => {
    const currentUserId = effectiveUserId;
    void (async () => {
      const loanId = data.loanId;
      const amount = Number(data.amount);
      if (typeof loanId !== 'string' || loanId.length === 0) {
        socket.emit('error', 'Missing loan id');
        return;
      }
      if (!Number.isFinite(amount) || amount <= 0) {
        socket.emit('error', 'Invalid repayment amount');
        return;
      }
      const loan = await prisma.loan.findUnique({ where: { id: loanId } });
      if (!loan || loan.userId !== currentUserId) {
        socket.emit('error', 'Loan not found');
        return;
      }
      if (loan.status !== 'active' && loan.status !== 'defaulted') {
        socket.emit('error', 'Loan not active');
        return;
      }
      const profile = await getEconomyProfile(currentUserId);
      const payAmount = Math.min(amount, loan.balance, profile.credits);
      if (payAmount <= 0) {
        socket.emit('error', 'Insufficient credits');
        return;
      }
      const updatedProfile = await applyEconomyAdjustment({
        userId: currentUserId,
        deltaCredits: -payAmount,
        reason: 'loan_repayment',
        meta: { loanId: loan.id },
      });
      const nextBalance = loan.balance - payAmount;
      await prisma.loan.update({
        where: { id: loan.id },
        data: {
          balance: nextBalance,
          status: nextBalance <= 0 ? 'paid' : loan.status,
        },
      });
      io.to(`user:${currentUserId}`).emit('economy:update', updatedProfile);
      void syncUserSocketsEconomy(currentUserId, updatedProfile);
    })().catch(err => {
      console.error('Failed to repay loan', err);
      socket.emit('error', 'Unable to repay loan');
    });
  });

  socket.on('economy:insurance:purchase', data => {
    const currentUserId = effectiveUserId;
    void (async () => {
      const vesselId = data.vesselId;
      if (typeof vesselId !== 'string' || vesselId.length === 0) {
        socket.emit('error', 'Missing vessel id');
        return;
      }
      const vessel = globalState.vessels.get(vesselId);
      if (!vessel || vessel.ownerId !== currentUserId) {
        socket.emit('error', 'Not authorized to insure this vessel');
        return;
      }
      const coverage = Number(data.coverage);
      const deductible = Number(data.deductible);
      const premiumRate = Number(data.premiumRate);
      if (
        !Number.isFinite(coverage) ||
        coverage <= 0 ||
        !Number.isFinite(deductible) ||
        deductible < 0 ||
        !Number.isFinite(premiumRate) ||
        premiumRate <= 0
      ) {
        socket.emit('error', 'Invalid insurance terms');
        return;
      }
      const termDays =
        Number.isFinite(data.termDays) && Number(data.termDays) > 0
          ? Number(data.termDays)
          : 30;
      const policy = await prisma.insurancePolicy.create({
        data: {
          vesselId,
          ownerId: currentUserId,
          type:
            data.type === 'loss' || data.type === 'salvage'
              ? data.type
              : 'damage',
          coverage,
          deductible,
          premiumRate,
          status: 'active',
          activeFrom: new Date(),
          activeUntil: new Date(Date.now() + termDays * 24 * 60 * 60 * 1000),
          lastChargedAt: new Date(),
        },
      });
      const profile = await applyEconomyAdjustment({
        userId: currentUserId,
        vesselId,
        deltaCredits: -premiumRate,
        reason: 'insurance_premium',
        meta: { policyId: policy.id },
      });
      io.to(`user:${currentUserId}`).emit('economy:update', profile);
      void syncUserSocketsEconomy(currentUserId, profile);
    })().catch(err => {
      console.error('Failed to purchase insurance', err);
      socket.emit('error', 'Unable to purchase insurance');
    });
  });

  socket.on('economy:insurance:cancel', data => {
    const currentUserId = effectiveUserId;
    void (async () => {
      const policyId = data.policyId;
      if (typeof policyId !== 'string' || policyId.length === 0) {
        socket.emit('error', 'Missing policy id');
        return;
      }
      const policy = await prisma.insurancePolicy.findUnique({
        where: { id: policyId },
      });
      if (!policy || policy.ownerId !== currentUserId) {
        socket.emit('error', 'Policy not found');
        return;
      }
      await prisma.insurancePolicy.update({
        where: { id: policy.id },
        data: { status: 'canceled', activeUntil: new Date() },
      });
    })().catch(err => {
      console.error('Failed to cancel insurance', err);
      socket.emit('error', 'Unable to cancel insurance');
    });
  });
}
