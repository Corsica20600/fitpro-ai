CREATE TABLE "WatchPairingToken" (
  "id" TEXT NOT NULL,
  "userProfileId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "WatchPairingToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WatchPairingToken_tokenHash_key" ON "WatchPairingToken"("tokenHash");
CREATE INDEX "WatchPairingToken_userProfileId_expiresAt_idx" ON "WatchPairingToken"("userProfileId", "expiresAt");
CREATE INDEX "WatchPairingToken_expiresAt_consumedAt_idx" ON "WatchPairingToken"("expiresAt", "consumedAt");

ALTER TABLE "WatchPairingToken"
  ADD CONSTRAINT "WatchPairingToken_userProfileId_fkey"
  FOREIGN KEY ("userProfileId")
  REFERENCES "UserProfile"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;
