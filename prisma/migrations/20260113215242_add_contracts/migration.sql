-- AlterTable
ALTER TABLE "CargoLot" ADD COLUMN     "cargoType" TEXT NOT NULL DEFAULT 'bulk',
ADD COLUMN     "carrierId" TEXT,
ADD COLUMN     "destinationPortId" TEXT,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "originPortId" TEXT,
ADD COLUMN     "readyAt" TIMESTAMP(3),
ADD COLUMN     "rewardCredits" DOUBLE PRECISION NOT NULL DEFAULT 0,
ALTER COLUMN "ownerId" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'listed';

-- CreateTable
CREATE TABLE "PassengerContract" (
    "id" TEXT NOT NULL,
    "vesselId" TEXT,
    "originPortId" TEXT NOT NULL,
    "destinationPortId" TEXT NOT NULL,
    "operatorId" TEXT,
    "passengerType" TEXT NOT NULL DEFAULT 'ferry',
    "paxCount" INTEGER NOT NULL,
    "rewardCredits" DOUBLE PRECISION NOT NULL,
    "readyAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'listed',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PassengerContract_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PassengerContract_originPortId_status_idx" ON "PassengerContract"("originPortId", "status");

-- CreateIndex
CREATE INDEX "PassengerContract_destinationPortId_status_idx" ON "PassengerContract"("destinationPortId", "status");

-- CreateIndex
CREATE INDEX "PassengerContract_operatorId_status_idx" ON "PassengerContract"("operatorId", "status");

-- CreateIndex
CREATE INDEX "CargoLot_originPortId_destinationPortId_idx" ON "CargoLot"("originPortId", "destinationPortId");
