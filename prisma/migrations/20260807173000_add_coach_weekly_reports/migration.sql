-- CreateEnum
CREATE TYPE "CoachWeeklyReportStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "CoachWeeklyReportFeedback" AS ENUM ('USEFUL', 'NOT_USEFUL');

-- CreateTable
CREATE TABLE "CoachWeeklyReport" (
    "id" TEXT NOT NULL,
    "userProfileId" TEXT NOT NULL,
    "periodKey" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "metrics" JSONB NOT NULL,
    "response" JSONB,
    "model" TEXT,
    "status" "CoachWeeklyReportStatus" NOT NULL DEFAULT 'PENDING',
    "errorCode" TEXT,
    "feedback" "CoachWeeklyReportFeedback",
    "generatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachWeeklyReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CoachWeeklyReport_userProfileId_periodKey_key" ON "CoachWeeklyReport"("userProfileId", "periodKey");

-- CreateIndex
CREATE INDEX "CoachWeeklyReport_userProfileId_periodEnd_idx" ON "CoachWeeklyReport"("userProfileId", "periodEnd");

-- CreateIndex
CREATE INDEX "CoachWeeklyReport_status_createdAt_idx" ON "CoachWeeklyReport"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "CoachWeeklyReport" ADD CONSTRAINT "CoachWeeklyReport_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
