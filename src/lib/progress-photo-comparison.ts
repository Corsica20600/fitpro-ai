import type { BodyMeasurementItem, ProgressPhotoItem, ProgressPhotoView } from "@/src/types/body-evolution";

const DAY_MS = 24 * 60 * 60 * 1000;
export const PROGRESS_PHOTO_MEASUREMENT_WINDOW_DAYS = 7;

type ComparisonMetricField = "weightKg" | "waistCm";

export type ProgressPhotoComparisonMetric = {
  field: ComparisonMetricField;
  label: string;
  unit: string;
  before: number;
  after: number;
  difference: number;
};

export type ProgressPhotoComparison = {
  elapsedDays: number;
  metrics: ProgressPhotoComparisonMetric[];
};

function toTime(value: string) {
  return new Date(value).getTime();
}

function round(value: number) {
  return Number(value.toFixed(1));
}

export function photosForComparisonView(photos: ProgressPhotoItem[], view: ProgressPhotoView) {
  return photos
    .filter((photo) => photo.view === view)
    .sort((left, right) => toTime(left.recordedAt) - toTime(right.recordedAt));
}

export function canCompareProgressPhotos(before: ProgressPhotoItem | null, after: ProgressPhotoItem | null) {
  return Boolean(before && after && before.id !== after.id && before.view === after.view);
}

export function findClosestMeasurementForProgressPhoto(
  measurements: BodyMeasurementItem[],
  photoRecordedAt: string,
  windowDays = PROGRESS_PHOTO_MEASUREMENT_WINDOW_DAYS,
) {
  const photoTime = toTime(photoRecordedAt);
  if (!Number.isFinite(photoTime)) return null;

  return measurements.reduce<{ measurement: BodyMeasurementItem; distance: number } | null>((closest, measurement) => {
    const distance = Math.abs(toTime(measurement.recordedAt) - photoTime);
    if (!Number.isFinite(distance) || distance > windowDays * DAY_MS) return closest;
    if (!closest || distance < closest.distance) return { measurement, distance };
    return closest;
  }, null)?.measurement ?? null;
}

export function createProgressPhotoComparison(
  before: ProgressPhotoItem | null,
  after: ProgressPhotoItem | null,
  measurements: BodyMeasurementItem[],
): ProgressPhotoComparison | null {
  if (!canCompareProgressPhotos(before, after) || !before || !after) return null;

  const beforeTime = toTime(before.recordedAt);
  const afterTime = toTime(after.recordedAt);
  if (!Number.isFinite(beforeTime) || !Number.isFinite(afterTime)) return null;

  const beforeMeasurement = findClosestMeasurementForProgressPhoto(measurements, before.recordedAt);
  const afterMeasurement = findClosestMeasurementForProgressPhoto(measurements, after.recordedAt);
  const metricDetails: Array<{ field: ComparisonMetricField; label: string; unit: string }> = [
    { field: "weightKg", label: "Poids", unit: "kg" },
    { field: "waistCm", label: "Tour de taille", unit: "cm" },
  ];

  return {
    elapsedDays: Math.abs(Math.round((afterTime - beforeTime) / DAY_MS)),
    metrics: metricDetails.flatMap(({ field, label, unit }) => {
      const beforeValue = beforeMeasurement?.[field];
      const afterValue = afterMeasurement?.[field];
      if (beforeValue == null || afterValue == null) return [];
      return [{ field, label, unit, before: beforeValue, after: afterValue, difference: round(afterValue - beforeValue) }];
    }),
  };
}
