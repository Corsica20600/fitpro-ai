CREATE TABLE "AiProgramGeneration" (
  "id" TEXT NOT NULL,
  "userProfileId" TEXT NOT NULL,
  "periodKey" TEXT NOT NULL,
  "goal" TEXT NOT NULL,
  "level" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AiProgramGeneration_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AiProgramGeneration_userProfileId_periodKey_createdAt_idx" ON "AiProgramGeneration"("userProfileId", "periodKey", "createdAt");
CREATE INDEX "AiProgramGeneration_periodKey_status_idx" ON "AiProgramGeneration"("periodKey", "status");

ALTER TABLE "AiProgramGeneration"
  ADD CONSTRAINT "AiProgramGeneration_userProfileId_fkey"
  FOREIGN KEY ("userProfileId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
