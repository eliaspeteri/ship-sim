import type { Prisma } from '@prisma/client';
import { prisma } from './prisma';

export type AuthAuditEvent = {
  userId?: string | null;
  event: string;
  detail?: Record<string, unknown> | null;
};

export async function recordAuthEvent(payload: AuthAuditEvent) {
  try {
    await prisma.authEvent.create({
      data: {
        userId: payload.userId || null,
        event: payload.event,
        detail: (payload.detail ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
      },
    });
  } catch (error) {
    console.warn('Failed to record auth event', error);
  }
}
