-- CreateEnum
CREATE TYPE "WatchSessionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED');

-- CreateTable
CREATE TABLE "WatchSession" (
    "id" TEXT NOT NULL,
    "workoutSessionId" TEXT NOT NULL,
    "currentExerciseIndex" INTEGER NOT NULL DEFAULT 0,
    "currentSetIndex" INTEGER NOT NULL DEFAULT 1,
    "status" "WatchSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastSyncAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WatchSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WatchSession_workoutSessionId_key" ON "WatchSession"("workoutSessionId");

-- CreateIndex
CREATE INDEX "WatchSession_status_lastSyncAt_idx" ON "WatchSession"("status", "lastSyncAt");

-- AddForeignKey
ALTER TABLE "WatchSession" ADD CONSTRAINT "WatchSession_workoutSessionId_fkey" FOREIGN KEY ("workoutSessionId") REFERENCES "WorkoutSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

