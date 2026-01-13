-- DropIndex
DROP INDEX "EnvironmentEvent_spaceId_endAt_idx";

-- AlterTable
ALTER TABLE "Space" ADD COLUMN     "rulesetType" TEXT DEFAULT 'CASUAL_PUBLIC';
