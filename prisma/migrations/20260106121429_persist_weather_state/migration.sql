-- CreateTable
CREATE TABLE "WeatherState" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "name" TEXT,
    "windSpeed" DOUBLE PRECISION NOT NULL,
    "windDirection" DOUBLE PRECISION NOT NULL,
    "windGusting" BOOLEAN NOT NULL,
    "windGustFactor" DOUBLE PRECISION NOT NULL,
    "currentSpeed" DOUBLE PRECISION NOT NULL,
    "currentDirection" DOUBLE PRECISION NOT NULL,
    "currentVariability" DOUBLE PRECISION NOT NULL,
    "seaState" INTEGER NOT NULL,
    "waterDepth" DOUBLE PRECISION,
    "visibility" DOUBLE PRECISION,
    "timeOfDay" DOUBLE PRECISION NOT NULL,
    "precipitation" TEXT,
    "precipitationIntensity" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeatherState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WeatherState_spaceId_key" ON "WeatherState"("spaceId");
