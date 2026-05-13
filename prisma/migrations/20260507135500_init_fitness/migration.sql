-- CreateEnum
CREATE TYPE "ProgramLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "ProgramGoal" AS ENUM ('STRENGTH', 'HYPERTROPHY', 'ENDURANCE', 'FAT_LOSS', 'GENERAL_FITNESS');

-- CreateEnum
CREATE TYPE "ExerciseCategory" AS ENUM ('CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS', 'LEGS', 'ABS', 'CARDIO_MOBILITY');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'THUMBNAIL', 'ANIMATION');

-- CreateEnum
CREATE TYPE "ProgramStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "MetricType" AS ENUM ('BODY_WEIGHT', 'BODY_FAT', 'WAIST', 'CHEST', 'ARM', 'THIGH', 'PERFORMANCE');

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "email" TEXT,
    "age" INTEGER,
    "heightCm" INTEGER,
    "weightKg" DOUBLE PRECISION,
    "trainingLevel" "ProgramLevel",
    "primaryGoal" "ProgramGoal",
    "sessionsPerWeek" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ExerciseCategory" NOT NULL,
    "primaryMuscle" TEXT NOT NULL,
    "secondaryMuscles" TEXT[],
    "equipment" TEXT[],
    "difficulty" "ProgramLevel" NOT NULL,
    "instructions" TEXT NOT NULL,
    "tips" TEXT[],
    "isCompound" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseMedia" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "durationSeconds" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExerciseMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Program" (
    "id" TEXT NOT NULL,
    "userProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "goal" "ProgramGoal" NOT NULL,
    "level" "ProgramLevel" NOT NULL,
    "sessionsPerWeek" INTEGER NOT NULL,
    "description" TEXT,
    "status" "ProgramStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramDay" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "dayIndex" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "focus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgramDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramExercise" (
    "id" TEXT NOT NULL,
    "programDayId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "sets" INTEGER NOT NULL,
    "repsMin" INTEGER,
    "repsMax" INTEGER,
    "repsText" TEXT,
    "restSeconds" INTEGER NOT NULL DEFAULT 60,
    "tempo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgramExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutSession" (
    "id" TEXT NOT NULL,
    "userProfileId" TEXT NOT NULL,
    "programId" TEXT,
    "programDayId" TEXT,
    "title" TEXT NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'PLANNED',
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "durationSeconds" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutSet" (
    "id" TEXT NOT NULL,
    "workoutSessionId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "programExerciseId" TEXT,
    "setIndex" INTEGER NOT NULL,
    "targetRepsMin" INTEGER,
    "targetRepsMax" INTEGER,
    "actualReps" INTEGER,
    "targetWeightKg" DOUBLE PRECISION,
    "actualWeightKg" DOUBLE PRECISION,
    "restSeconds" INTEGER,
    "rpe" INTEGER,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkoutSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgressMetric" (
    "id" TEXT NOT NULL,
    "userProfileId" TEXT NOT NULL,
    "metricType" "MetricType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "measuredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgressMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_email_key" ON "UserProfile"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Exercise_slug_key" ON "Exercise"("slug");

-- CreateIndex
CREATE INDEX "Exercise_category_difficulty_idx" ON "Exercise"("category", "difficulty");

-- CreateIndex
CREATE INDEX "Exercise_isActive_idx" ON "Exercise"("isActive");

-- CreateIndex
CREATE INDEX "ExerciseMedia_exerciseId_type_idx" ON "ExerciseMedia"("exerciseId", "type");

-- CreateIndex
CREATE INDEX "Program_userProfileId_status_idx" ON "Program"("userProfileId", "status");

-- CreateIndex
CREATE INDEX "ProgramDay_programId_idx" ON "ProgramDay"("programId");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramDay_programId_dayIndex_key" ON "ProgramDay"("programId", "dayIndex");

-- CreateIndex
CREATE INDEX "ProgramExercise_exerciseId_idx" ON "ProgramExercise"("exerciseId");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramExercise_programDayId_orderIndex_key" ON "ProgramExercise"("programDayId", "orderIndex");

-- CreateIndex
CREATE INDEX "WorkoutSession_userProfileId_status_createdAt_idx" ON "WorkoutSession"("userProfileId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "WorkoutSet_workoutSessionId_setIndex_idx" ON "WorkoutSet"("workoutSessionId", "setIndex");

-- CreateIndex
CREATE INDEX "WorkoutSet_exerciseId_idx" ON "WorkoutSet"("exerciseId");

-- CreateIndex
CREATE INDEX "ProgressMetric_userProfileId_metricType_measuredAt_idx" ON "ProgressMetric"("userProfileId", "metricType", "measuredAt");

-- AddForeignKey
ALTER TABLE "ExerciseMedia" ADD CONSTRAINT "ExerciseMedia_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Program" ADD CONSTRAINT "Program_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramDay" ADD CONSTRAINT "ProgramDay_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramExercise" ADD CONSTRAINT "ProgramExercise_programDayId_fkey" FOREIGN KEY ("programDayId") REFERENCES "ProgramDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramExercise" ADD CONSTRAINT "ProgramExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSession" ADD CONSTRAINT "WorkoutSession_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSession" ADD CONSTRAINT "WorkoutSession_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSet" ADD CONSTRAINT "WorkoutSet_workoutSessionId_fkey" FOREIGN KEY ("workoutSessionId") REFERENCES "WorkoutSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSet" ADD CONSTRAINT "WorkoutSet_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSet" ADD CONSTRAINT "WorkoutSet_programExerciseId_fkey" FOREIGN KEY ("programExerciseId") REFERENCES "ProgramExercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressMetric" ADD CONSTRAINT "ProgressMetric_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

