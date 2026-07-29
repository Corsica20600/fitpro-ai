-- CreateTable
CREATE TABLE "HealthDevice" (
    "id" TEXT NOT NULL,
    "userProfileId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "lastSeenAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthDevice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HealthDevice_tokenHash_key" ON "HealthDevice"("tokenHash");

-- CreateIndex
CREATE INDEX "HealthDevice_userProfileId_revokedAt_idx" ON "HealthDevice"("userProfileId", "revokedAt");

-- CreateIndex
CREATE INDEX "HealthDevice_lastSeenAt_idx" ON "HealthDevice"("lastSeenAt");

-- AddForeignKey
ALTER TABLE "HealthDevice" ADD CONSTRAINT "HealthDevice_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
