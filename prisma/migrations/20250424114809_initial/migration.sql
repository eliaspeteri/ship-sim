-- CreateTable
CREATE TABLE "Vessel" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "length" DOUBLE PRECISION NOT NULL,
    "beam" DOUBLE PRECISION NOT NULL,
    "draft" DOUBLE PRECISION NOT NULL,
    "displacement" DOUBLE PRECISION NOT NULL,
    "mass" DOUBLE PRECISION NOT NULL,
    "maxSpeed" DOUBLE PRECISION NOT NULL,
    "maxRudderAngle" DOUBLE PRECISION NOT NULL,
    "enginePower" DOUBLE PRECISION NOT NULL,
    "fuelCapacity" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vessel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("userId","roleId")
);

-- CreateTable
CREATE TABLE "VesselState" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "vesselId" INTEGER,
    "positionX" DOUBLE PRECISION NOT NULL,
    "positionY" DOUBLE PRECISION NOT NULL,
    "positionZ" DOUBLE PRECISION NOT NULL,
    "heading" DOUBLE PRECISION NOT NULL,
    "roll" DOUBLE PRECISION NOT NULL,
    "pitch" DOUBLE PRECISION NOT NULL,
    "velocityX" DOUBLE PRECISION NOT NULL,
    "velocityY" DOUBLE PRECISION NOT NULL,
    "velocityZ" DOUBLE PRECISION NOT NULL,
    "yawRate" DOUBLE PRECISION,
    "rollRate" DOUBLE PRECISION,
    "pitchRate" DOUBLE PRECISION,
    "throttle" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rudderAngle" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mass" DOUBLE PRECISION,
    "length" DOUBLE PRECISION,
    "beam" DOUBLE PRECISION,
    "draft" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VesselState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnvironmentState" (
    "id" SERIAL NOT NULL,
    "windSpeed" DOUBLE PRECISION NOT NULL,
    "windDirection" DOUBLE PRECISION NOT NULL,
    "currentSpeed" DOUBLE PRECISION NOT NULL,
    "currentDirection" DOUBLE PRECISION NOT NULL,
    "seaState" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnvironmentState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "cameraMode" TEXT NOT NULL DEFAULT 'thirdPerson',
    "soundEnabled" BOOLEAN NOT NULL DEFAULT true,
    "showHUD" BOOLEAN NOT NULL DEFAULT true,
    "timeScale" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scenario" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "initialVesselState" JSONB NOT NULL,
    "initialEnvironment" JSONB NOT NULL,
    "duration" INTEGER,
    "objectives" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scenario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_name_key" ON "Permission"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VesselState_userId_key" ON "VesselState"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VesselState" ADD CONSTRAINT "VesselState_vesselId_fkey" FOREIGN KEY ("vesselId") REFERENCES "Vessel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VesselState" ADD CONSTRAINT "VesselState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
