-- CreateTable
CREATE TABLE "SpaceAccess" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "inviteToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpaceAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SpaceAccess_userId_idx" ON "SpaceAccess"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SpaceAccess_userId_spaceId_key" ON "SpaceAccess"("userId", "spaceId");

-- CreateTable
CREATE TABLE "Ban" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "username" TEXT,
    "spaceId" TEXT NOT NULL DEFAULT 'global',
    "reason" TEXT,
    "createdBy" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ban_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mute" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "username" TEXT,
    "spaceId" TEXT NOT NULL DEFAULT 'global',
    "reason" TEXT,
    "createdBy" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnvironmentEvent" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL DEFAULT 'global',
    "name" TEXT,
    "pattern" TEXT,
    "payload" JSONB,
    "runAt" TIMESTAMP(3) NOT NULL,
    "executedAt" TIMESTAMP(3),
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnvironmentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "event" TEXT NOT NULL,
    "detail" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Ban_spaceId_idx" ON "Ban"("spaceId");

-- CreateIndex
CREATE INDEX "Ban_userId_idx" ON "Ban"("userId");

-- CreateIndex
CREATE INDEX "Ban_username_idx" ON "Ban"("username");

-- CreateIndex
CREATE INDEX "Mute_spaceId_idx" ON "Mute"("spaceId");

-- CreateIndex
CREATE INDEX "Mute_userId_idx" ON "Mute"("userId");

-- CreateIndex
CREATE INDEX "Mute_username_idx" ON "Mute"("username");

-- CreateIndex
CREATE INDEX "EnvironmentEvent_spaceId_runAt_idx" ON "EnvironmentEvent"("spaceId", "runAt");

-- CreateIndex
CREATE INDEX "AuthEvent_userId_idx" ON "AuthEvent"("userId");

-- Add user progression/economy fields
ALTER TABLE "User" ADD COLUMN "rank" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "User" ADD COLUMN "experience" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "credits" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "safetyScore" DOUBLE PRECISION NOT NULL DEFAULT 1.0;

-- Expand spaces for scenarios/tutorials
ALTER TABLE "Space" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'free';
ALTER TABLE "Space" ADD COLUMN "rankRequired" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Space" ADD COLUMN "rules" JSONB;

-- Space roles for host gating
ALTER TABLE "SpaceAccess" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'member';

-- Missions and economy tables
CREATE TABLE "Mission" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL DEFAULT 'global',
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "originLat" DOUBLE PRECISION NOT NULL,
    "originLon" DOUBLE PRECISION NOT NULL,
    "destinationLat" DOUBLE PRECISION NOT NULL,
    "destinationLon" DOUBLE PRECISION NOT NULL,
    "rewardCredits" DOUBLE PRECISION NOT NULL,
    "requiredRank" INTEGER NOT NULL DEFAULT 1,
    "payload" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MissionAssignment" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vesselId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'assigned',
    "progress" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MissionAssignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EconomyTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vesselId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EconomyTransaction_pkey" PRIMARY KEY ("id")
);

-- Foreign keys
ALTER TABLE "MissionAssignment"
ADD CONSTRAINT "MissionAssignment_missionId_fkey"
FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Indexes
CREATE INDEX "Mission_spaceId_active_idx" ON "Mission"("spaceId", "active");
CREATE INDEX "MissionAssignment_userId_status_idx" ON "MissionAssignment"("userId", "status");
CREATE INDEX "MissionAssignment_missionId_idx" ON "MissionAssignment"("missionId");
CREATE INDEX "EconomyTransaction_userId_idx" ON "EconomyTransaction"("userId");

-- Environment event end window
ALTER TABLE "EnvironmentEvent" ADD COLUMN "endAt" TIMESTAMP(3);
ALTER TABLE "EnvironmentEvent" ADD COLUMN "endPayload" JSONB;
ALTER TABLE "EnvironmentEvent" ADD COLUMN "endedAt" TIMESTAMP(3);

CREATE INDEX "EnvironmentEvent_spaceId_endAt_idx" ON "EnvironmentEvent"("spaceId", "endAt");
