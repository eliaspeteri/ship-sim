import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

type PrismaClientWithModeration = PrismaClient & {
  ban: {
    findFirst: (...args: unknown[]) => Promise<unknown>;
    findMany: (...args: unknown[]) => Promise<unknown>;
    create: (...args: unknown[]) => Promise<unknown>;
    delete: (...args: unknown[]) => Promise<unknown>;
  };
  mute: {
    findFirst: (...args: unknown[]) => Promise<unknown>;
    findMany: (...args: unknown[]) => Promise<unknown>;
    create: (...args: unknown[]) => Promise<unknown>;
    delete: (...args: unknown[]) => Promise<unknown>;
  };
  environmentEvent: {
    findMany: (...args: unknown[]) => Promise<unknown>;
    findFirst: (...args: unknown[]) => Promise<unknown>;
    findUnique: (...args: unknown[]) => Promise<unknown>;
    create: (...args: unknown[]) => Promise<unknown>;
    update: (...args: unknown[]) => Promise<unknown>;
    delete: (...args: unknown[]) => Promise<unknown>;
  };
  authEvent: {
    create: (...args: unknown[]) => Promise<unknown>;
  };
  mission: {
    findMany: (...args: unknown[]) => Promise<unknown>;
    findFirst: (...args: unknown[]) => Promise<unknown>;
    findUnique: (...args: unknown[]) => Promise<unknown>;
    create: (...args: unknown[]) => Promise<unknown>;
    update: (...args: unknown[]) => Promise<unknown>;
    delete: (...args: unknown[]) => Promise<unknown>;
  };
  missionAssignment: {
    findMany: (...args: unknown[]) => Promise<unknown>;
    findFirst: (...args: unknown[]) => Promise<unknown>;
    findUnique: (...args: unknown[]) => Promise<unknown>;
    create: (...args: unknown[]) => Promise<unknown>;
    update: (...args: unknown[]) => Promise<unknown>;
    delete: (...args: unknown[]) => Promise<unknown>;
    upsert: (...args: unknown[]) => Promise<unknown>;
  };
  economyTransaction: {
    findMany: (...args: unknown[]) => Promise<unknown>;
    create: (...args: unknown[]) => Promise<unknown>;
  };
};

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClientWithModeration;
};

const adapter = new PrismaPg(new Pool({ connectionString }));

export const prisma =
  globalForPrisma.prisma ||
  (new PrismaClient({ adapter }) as PrismaClientWithModeration);

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
