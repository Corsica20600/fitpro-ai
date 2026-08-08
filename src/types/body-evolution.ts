export const BODY_MEASUREMENT_FIELDS = [
  "weightKg",
  "waistCm",
  "chestCm",
  "leftArmCm",
  "rightArmCm",
  "leftThighCm",
  "rightThighCm",
  "hipsCm",
  "leftCalfCm",
  "rightCalfCm",
  "bodyFatPercentage",
] as const;

export type BodyMeasurementField = (typeof BODY_MEASUREMENT_FIELDS)[number];

export type BodyMeasurementInput = Partial<Record<BodyMeasurementField, number | null>> & {
  recordedAt: string;
  heightCm?: number | null;
};

export type BodyMeasurementItem = Record<BodyMeasurementField, number | null> & {
  id: string;
  recordedAt: string;
};

export type MeasurementDelta = {
  field: BodyMeasurementField;
  label: string;
  unit: string;
  first: number;
  latest: number;
  difference: number;
};

export type ProgressPhotoView = "FRONT" | "SIDE" | "BACK" | "FREE";

export type ProgressPhotoItem = {
  id: string;
  recordedAt: string;
  view: ProgressPhotoView;
  mimeType: string;
  byteSize: number;
  width: number | null;
  height: number | null;
  imageUrl: string;
};

export type EvolutionOverview = {
  profile: {
    displayName: string;
    heightCm: number | null;
  };
  currentWeightKg: number | null;
  measurements: BodyMeasurementItem[];
  weightSeries: Array<{ key: string; label: string; value: number; sessions: number }>;
  deltas: MeasurementDelta[];
  photos: ProgressPhotoItem[];
  galleryCount: number;
};
