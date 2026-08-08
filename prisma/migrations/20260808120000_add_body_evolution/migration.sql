-- CreateEnum
CREATE TYPE "ProgressPhotoView" AS ENUM ('FRONT', 'SIDE', 'BACK', 'FREE');

-- CreateTable
CREATE TABLE "BodyMeasurement" (
    "id" TEXT NOT NULL,
    "userProfileId" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weightKg" DOUBLE PRECISION,
    "waistCm" DOUBLE PRECISION,
    "chestCm" DOUBLE PRECISION,
    "leftArmCm" DOUBLE PRECISION,
    "rightArmCm" DOUBLE PRECISION,
    "leftThighCm" DOUBLE PRECISION,
    "rightThighCm" DOUBLE PRECISION,
    "hipsCm" DOUBLE PRECISION,
    "leftCalfCm" DOUBLE PRECISION,
    "rightCalfCm" DOUBLE PRECISION,
    "bodyFatPercentage" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BodyMeasurement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgressPhoto" (
    "id" TEXT NOT NULL,
    "userProfileId" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "view" "ProgressPhotoView" NOT NULL,
    "blobPath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgressPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BodyMeasurement_userProfileId_recordedAt_idx" ON "BodyMeasurement"("userProfileId", "recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProgressPhoto_blobPath_key" ON "ProgressPhoto"("blobPath");

-- CreateIndex
CREATE INDEX "ProgressPhoto_userProfileId_recordedAt_idx" ON "ProgressPhoto"("userProfileId", "recordedAt");

-- CreateIndex
CREATE INDEX "ProgressPhoto_userProfileId_view_recordedAt_idx" ON "ProgressPhoto"("userProfileId", "view", "recordedAt");

-- AddForeignKey
ALTER TABLE "BodyMeasurement" ADD CONSTRAINT "BodyMeasurement_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressPhoto" ADD CONSTRAINT "ProgressPhoto_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
