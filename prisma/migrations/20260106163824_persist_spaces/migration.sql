-- AlterTable
ALTER TABLE "ChatMessage" ADD COLUMN     "spaceId" TEXT NOT NULL DEFAULT 'global';

-- AlterTable
ALTER TABLE "Vessel" ADD COLUMN     "spaceId" TEXT NOT NULL DEFAULT 'global';

-- AlterTable
ALTER TABLE "WeatherState" ALTER COLUMN "spaceId" SET DEFAULT 'global';

-- CreateTable
CREATE TABLE "Space" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "inviteToken" TEXT,
    "passwordHash" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Space_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Space_inviteToken_key" ON "Space"("inviteToken");

-- CreateIndex
CREATE INDEX "Space_visibility_idx" ON "Space"("visibility");

-- CreateIndex
CREATE INDEX "ChatMessage_spaceId_channel_idx" ON "ChatMessage"("spaceId", "channel");

-- CreateIndex
CREATE INDEX "Vessel_spaceId_idx" ON "Vessel"("spaceId");
