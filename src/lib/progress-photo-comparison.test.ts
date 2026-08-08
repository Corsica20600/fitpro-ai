import assert from "node:assert/strict";
import test from "node:test";
import {
  canCompareProgressPhotos,
  createProgressPhotoComparison,
  findClosestMeasurementForProgressPhoto,
  photosForComparisonView,
} from "@/src/lib/progress-photo-comparison";
import type { BodyMeasurementItem, ProgressPhotoItem } from "@/src/types/body-evolution";

const photo = (id: string, recordedAt: string, view: ProgressPhotoItem["view"] = "FRONT"): ProgressPhotoItem => ({
  id,
  recordedAt,
  view,
  mimeType: "image/webp",
  byteSize: 12,
  width: 100,
  height: 100,
  imageUrl: `/photo/${id}`,
});

const measurement = (id: string, recordedAt: string, weightKg: number | null, waistCm: number | null): BodyMeasurementItem => ({
  id,
  recordedAt,
  weightKg,
  waistCm,
  chestCm: null,
  leftArmCm: null,
  rightArmCm: null,
  leftThighCm: null,
  rightThighCm: null,
  hipsCm: null,
  leftCalfCm: null,
  rightCalfCm: null,
  fatMassKg: null,
  bodyFatPercentage: null,
});

test("filters comparison candidates by orientation and date", () => {
  const photos = [photo("late", "2026-08-08T12:00:00.000Z"), photo("side", "2026-08-01T12:00:00.000Z", "SIDE"), photo("early", "2026-08-01T12:00:00.000Z")];
  assert.deepEqual(photosForComparisonView(photos, "FRONT").map((item) => item.id), ["early", "late"]);
});

test("refuses a comparison using the same photo twice", () => {
  const same = photo("one", "2026-08-01T12:00:00.000Z");
  assert.equal(canCompareProgressPhotos(same, same), false);
  assert.equal(canCompareProgressPhotos(same, photo("side", "2026-08-08T12:00:00.000Z", "SIDE")), false);
});

test("calculates elapsed time and measurement deltas from nearby measurements", () => {
  const before = photo("before", "2026-05-01T12:00:00.000Z");
  const after = photo("after", "2026-07-24T12:00:00.000Z");
  const comparison = createProgressPhotoComparison(before, after, [
    measurement("one", "2026-05-02T12:00:00.000Z", 84.2, 96),
    measurement("two", "2026-07-24T12:00:00.000Z", 81, 90),
  ]);
  assert.equal(comparison?.elapsedDays, 84);
  assert.deepEqual(comparison?.metrics.map((item) => [item.field, item.difference]), [["weightKg", -3.2], ["waistCm", -6]]);
});

test("does not associate a measurement outside the valid proximity window", () => {
  const found = findClosestMeasurementForProgressPhoto(
    [measurement("far", "2026-05-10T12:00:00.000Z", 80, 90)],
    "2026-05-01T12:00:00.000Z",
  );
  assert.equal(found, null);
  const comparison = createProgressPhotoComparison(
    photo("before", "2026-05-01T12:00:00.000Z"),
    photo("after", "2026-06-01T12:00:00.000Z"),
    [measurement("far", "2026-05-10T12:00:00.000Z", 80, 90)],
  );
  assert.deepEqual(comparison?.metrics, []);
});
