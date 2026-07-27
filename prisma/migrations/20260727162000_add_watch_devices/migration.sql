CREATE TABLE "WatchDevice" (
  "id" TEXT NOT NULL,
  "userProfileId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "lastSeenAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WatchDevice_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WatchDevice_tokenHash_key" ON "WatchDevice"("tokenHash");
CREATE INDEX "WatchDevice_userProfileId_revokedAt_idx" ON "WatchDevice"("userProfileId", "revokedAt");
CREATE INDEX "WatchDevice_lastSeenAt_idx" ON "WatchDevice"("lastSeenAt");

ALTER TABLE "WatchDevice"
  ADD CONSTRAINT "WatchDevice_userProfileId_fkey"
  FOREIGN KEY ("userProfileId")
  REFERENCES "UserProfile"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;
