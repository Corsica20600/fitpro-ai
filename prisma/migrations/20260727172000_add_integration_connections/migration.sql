CREATE TYPE "IntegrationProvider" AS ENUM (
  'SPOTIFY',
  'HEALTH_CONNECT',
  'SAMSUNG_HEALTH'
);

CREATE TYPE "IntegrationStatus" AS ENUM (
  'DISCONNECTED',
  'PENDING',
  'CONNECTED',
  'ERROR'
);

CREATE TABLE "IntegrationConnection" (
  "id" TEXT NOT NULL,
  "userProfileId" TEXT NOT NULL,
  "provider" "IntegrationProvider" NOT NULL,
  "status" "IntegrationStatus" NOT NULL DEFAULT 'PENDING',
  "externalAccountId" TEXT,
  "displayName" TEXT,
  "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "tokenExpiresAt" TIMESTAMP(3),
  "metadata" JSONB,
  "lastSyncAt" TIMESTAMP(3),
  "connectedAt" TIMESTAMP(3),
  "disconnectedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "IntegrationConnection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "IntegrationConnection_userProfileId_provider_key" ON "IntegrationConnection"("userProfileId", "provider");
CREATE INDEX "IntegrationConnection_provider_status_idx" ON "IntegrationConnection"("provider", "status");
CREATE INDEX "IntegrationConnection_userProfileId_status_idx" ON "IntegrationConnection"("userProfileId", "status");

ALTER TABLE "IntegrationConnection"
  ADD CONSTRAINT "IntegrationConnection_userProfileId_fkey"
  FOREIGN KEY ("userProfileId")
  REFERENCES "UserProfile"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;
