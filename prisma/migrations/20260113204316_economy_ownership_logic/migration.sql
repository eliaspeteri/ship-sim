-- AlterTable
ALTER TABLE "Vessel" ADD COLUMN     "chartererId" TEXT,
ADD COLUMN     "leaseeId" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "storagePortId" TEXT,
ADD COLUMN     "storedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "CrewContract" (
    "id" TEXT NOT NULL,
    "vesselId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "wageRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "revenueShare" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "lockedAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrewContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Loan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "principal" DOUBLE PRECISION NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL,
    "interestRate" DOUBLE PRECISION NOT NULL DEFAULT 0.08,
    "status" TEXT NOT NULL DEFAULT 'active',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMP(3),
    "lastAccruedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Loan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsurancePolicy" (
    "id" TEXT NOT NULL,
    "vesselId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "coverage" DOUBLE PRECISION NOT NULL,
    "deductible" DOUBLE PRECISION NOT NULL,
    "premiumRate" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "activeFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activeUntil" TIMESTAMP(3),
    "lastChargedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsurancePolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VesselSale" (
    "id" TEXT NOT NULL,
    "vesselId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "buyerId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'sale',
    "price" DOUBLE PRECISION NOT NULL,
    "reservePrice" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),

    CONSTRAINT "VesselSale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VesselLease" (
    "id" TEXT NOT NULL,
    "vesselId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "lesseeId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'charter',
    "ratePerHour" DOUBLE PRECISION NOT NULL,
    "revenueShare" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'open',
    "startedAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "lastChargedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VesselLease_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CargoLot" (
    "id" TEXT NOT NULL,
    "vesselId" TEXT,
    "ownerId" TEXT NOT NULL,
    "description" TEXT,
    "value" DOUBLE PRECISION NOT NULL,
    "liabilityRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'loaded',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CargoLot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CrewContract_vesselId_status_idx" ON "CrewContract"("vesselId", "status");

-- CreateIndex
CREATE INDEX "CrewContract_userId_status_idx" ON "CrewContract"("userId", "status");

-- CreateIndex
CREATE INDEX "Loan_userId_status_idx" ON "Loan"("userId", "status");

-- CreateIndex
CREATE INDEX "InsurancePolicy_vesselId_status_idx" ON "InsurancePolicy"("vesselId", "status");

-- CreateIndex
CREATE INDEX "InsurancePolicy_ownerId_status_idx" ON "InsurancePolicy"("ownerId", "status");

-- CreateIndex
CREATE INDEX "VesselSale_status_type_idx" ON "VesselSale"("status", "type");

-- CreateIndex
CREATE INDEX "VesselLease_status_type_idx" ON "VesselLease"("status", "type");

-- CreateIndex
CREATE INDEX "CargoLot_ownerId_status_idx" ON "CargoLot"("ownerId", "status");

-- CreateIndex
CREATE INDEX "CargoLot_vesselId_idx" ON "CargoLot"("vesselId");
