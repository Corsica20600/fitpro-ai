-- Preserve existing percentage-based measurements while accepting fat mass in kilograms.
ALTER TABLE "BodyMeasurement" ADD COLUMN "fatMassKg" DOUBLE PRECISION;
