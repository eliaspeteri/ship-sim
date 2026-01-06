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
