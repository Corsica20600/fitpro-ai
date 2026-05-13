-- CreateEnum
CREATE TYPE "ExerciseMovementType" AS ENUM ('COMPOUND', 'ISOLATION', 'CARRY', 'PLYOMETRIC', 'ISOMETRIC', 'CARDIO', 'MOBILITY', 'STRETCH');

-- CreateEnum
CREATE TYPE "ExerciseObjective" AS ENUM ('STRENGTH', 'MUSCLE_GAIN', 'ENDURANCE', 'FAT_LOSS', 'POWER', 'MOBILITY', 'REHAB', 'POSTURE');

-- CreateEnum
CREATE TYPE "MediaFormat" AS ENUM ('LOTTIE', 'WEBP', 'GIF', 'MP4', 'SVG', 'JPG', 'PNG', 'OTHER');

-- Exercise: add enriched catalog fields with safe defaults for existing rows
ALTER TABLE "Exercise"
  DROP COLUMN "instructions",
  DROP COLUMN "primaryMuscle",
  DROP COLUMN "tips",
  ADD COLUMN "alternatives" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "commonMistakes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "contraindications" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "detailedInstructions" TEXT NOT NULL DEFAULT 'A completer',
  ADD COLUMN "fallbackAnimationPath" TEXT NOT NULL DEFAULT '/media/exercises/fallback-anim.svg',
  ADD COLUMN "fallbackImagePath" TEXT NOT NULL DEFAULT '/media/exercises/fallback-image.svg',
  ADD COLUMN "fallbackThumbnailPath" TEXT NOT NULL DEFAULT '/media/exercises/fallback-thumb.svg',
  ADD COLUMN "movementType" "ExerciseMovementType" NOT NULL DEFAULT 'COMPOUND',
  ADD COLUMN "objectives" "ExerciseObjective"[] NOT NULL DEFAULT ARRAY['MUSCLE_GAIN']::"ExerciseObjective"[],
  ADD COLUMN "primaryAnimationPath" TEXT,
  ADD COLUMN "primaryMuscles" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "shortTechnicalCues" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "variants" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- ExerciseMedia: richer asset metadata and fallback-compatible URLs
ALTER TABLE "ExerciseMedia"
  ADD COLUMN "format" "MediaFormat" NOT NULL DEFAULT 'OTHER',
  ADD COLUMN "isLoop" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "license" TEXT,
  ADD COLUMN "publicUrl" TEXT,
  ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "sourceName" TEXT,
  ADD COLUMN "sourceUrl" TEXT,
  ADD COLUMN "storagePath" TEXT,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  ALTER COLUMN "url" DROP NOT NULL;

UPDATE "ExerciseMedia"
SET
  "publicUrl" = COALESCE("publicUrl", "url"),
  "storagePath" = COALESCE("storagePath", REPLACE(COALESCE("url", ''), '/', '')),
  "format" = CASE
    WHEN COALESCE("mimeType", '') LIKE '%webp%' THEN 'WEBP'::"MediaFormat"
    WHEN COALESCE("mimeType", '') LIKE '%gif%' THEN 'GIF'::"MediaFormat"
    WHEN COALESCE("mimeType", '') LIKE '%svg%' THEN 'SVG'::"MediaFormat"
    WHEN COALESCE("mimeType", '') LIKE '%mp4%' THEN 'MP4'::"MediaFormat"
    WHEN COALESCE("mimeType", '') LIKE '%jpeg%' OR COALESCE("mimeType", '') LIKE '%jpg%' THEN 'JPG'::"MediaFormat"
    WHEN COALESCE("mimeType", '') LIKE '%png%' THEN 'PNG'::"MediaFormat"
    ELSE "format"
  END;

ALTER TABLE "ExerciseMedia"
  ALTER COLUMN "publicUrl" SET NOT NULL,
  ALTER COLUMN "storagePath" SET NOT NULL;

CREATE INDEX "Exercise_movementType_idx" ON "Exercise"("movementType");
CREATE INDEX "ExerciseMedia_exerciseId_sortOrder_idx" ON "ExerciseMedia"("exerciseId", "sortOrder");
