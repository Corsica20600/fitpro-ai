-- Add French-localized fields without altering existing English source fields
ALTER TABLE "Exercise"
  ADD COLUMN "nameFr" TEXT,
  ADD COLUMN "primaryMusclesFr" TEXT[] DEFAULT ARRAY[]::TEXT[] NOT NULL,
  ADD COLUMN "equipmentFr" TEXT[] DEFAULT ARRAY[]::TEXT[] NOT NULL,
  ADD COLUMN "instructionsFr" TEXT,
  ADD COLUMN "commonMistakesFr" TEXT[] DEFAULT ARRAY[]::TEXT[] NOT NULL;
