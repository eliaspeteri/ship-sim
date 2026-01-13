-- AlterTable
ALTER TABLE "CargoLot" ADD COLUMN     "portId" TEXT,
ADD COLUMN     "weightTons" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "CargoLot_portId_status_idx" ON "CargoLot"("portId", "status");
