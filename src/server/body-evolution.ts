import { prisma } from "@/src/lib/prisma";
import {
  BODY_MEASUREMENT_FIELDS,
  type BodyMeasurementField,
  type BodyMeasurementInput,
  type BodyMeasurementItem,
  type EvolutionOverview,
  type MeasurementDelta,
} from "@/src/types/body-evolution";
import { serializeProgressPhotos } from "@/src/server/progress-photos";

const FIELD_DETAILS: Record<BodyMeasurementField, { label: string; unit: string }> = {
  weightKg: { label: "Poids", unit: "kg" },
  waistCm: { label: "Tour de taille", unit: "cm" },
  chestCm: { label: "Poitrine", unit: "cm" },
  leftArmCm: { label: "Bras gauche", unit: "cm" },
  rightArmCm: { label: "Bras droit", unit: "cm" },
  leftThighCm: { label: "Cuisse gauche", unit: "cm" },
  rightThighCm: { label: "Cuisse droite", unit: "cm" },
  hipsCm: { label: "Hanches", unit: "cm" },
  leftCalfCm: { label: "Mollet gauche", unit: "cm" },
  rightCalfCm: { label: "Mollet droit", unit: "cm" },
  bodyFatPercentage: { label: "Masse grasse", unit: "%" },
};

type EvolutionProfile = {
  id: string;
  displayName: string;
  heightCm: number | null;
};

function toMeasurementItem(item: {
  id: string;
  recordedAt: Date;
} & Record<BodyMeasurementField, number | null>): BodyMeasurementItem {
  return {
    id: item.id,
    recordedAt: item.recordedAt.toISOString(),
    ...Object.fromEntries(BODY_MEASUREMENT_FIELDS.map((field) => [field, item[field]])) as Record<BodyMeasurementField, number | null>,
  };
}

function formatShortDate(value: Date) {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(value);
}

function collectDeltas(measurements: BodyMeasurementItem[]): MeasurementDelta[] {
  const chronological = [...measurements].reverse();

  return BODY_MEASUREMENT_FIELDS.flatMap((field) => {
    const values = chronological.filter((measurement) => measurement[field] != null);
    if (values.length < 2) return [];

    const first = values[0]?.[field];
    const latest = values.at(-1)?.[field];
    if (first == null || latest == null) return [];

    const detail = FIELD_DETAILS[field];
    return [{
      field,
      label: detail.label,
      unit: detail.unit,
      first,
      latest,
      difference: Number((latest - first).toFixed(1)),
    }];
  });
}

/**
 * BodyMeasurement is the source of truth for the Evolution screen. The older
 * profile weight is updated for legacy consumers only and is never read here.
 */
export async function getEvolutionOverview(profile: EvolutionProfile): Promise<EvolutionOverview> {
  const [rawMeasurements, rawPhotos, galleryCount] = await Promise.all([
    prisma.bodyMeasurement.findMany({
      where: { userProfileId: profile.id },
      orderBy: [{ recordedAt: "desc" }, { createdAt: "desc" }],
      take: 100,
    }),
    prisma.progressPhoto.findMany({
      where: { userProfileId: profile.id },
      orderBy: [{ recordedAt: "desc" }, { createdAt: "desc" }],
      take: 60,
      select: {
        id: true,
        recordedAt: true,
        view: true,
        mimeType: true,
        byteSize: true,
        width: true,
        height: true,
      },
    }),
    prisma.progressPhoto.count({ where: { userProfileId: profile.id } }),
  ]);
  const measurements = rawMeasurements.map(toMeasurementItem);
  const currentWeightKg = measurements.find((measurement) => measurement.weightKg != null)?.weightKg ?? null;
  const weightSeries = [...measurements]
    .reverse()
    .filter((measurement) => measurement.weightKg != null)
    .slice(-12)
    .map((measurement) => ({
      key: measurement.id,
      label: formatShortDate(new Date(measurement.recordedAt)),
      value: measurement.weightKg ?? 0,
      sessions: 0,
    }));

  return {
    profile: { displayName: profile.displayName, heightCm: profile.heightCm },
    currentWeightKg,
    measurements,
    weightSeries,
    deltas: collectDeltas(measurements),
    photos: serializeProgressPhotos(rawPhotos),
    galleryCount,
  };
}

export async function createBodyMeasurement(profile: EvolutionProfile, input: BodyMeasurementInput) {
  const recordedAt = new Date(`${input.recordedAt}T12:00:00.000Z`);
  if (Number.isNaN(recordedAt.getTime())) throw new Error("INVALID_RECORDED_AT");

  const measurementData = Object.fromEntries(
    BODY_MEASUREMENT_FIELDS.map((field) => [field, input[field] ?? null]),
  ) as Record<BodyMeasurementField, number | null>;

  const measurement = await prisma.$transaction(async (tx) => {
    const created = await tx.bodyMeasurement.create({
      data: {
        userProfileId: profile.id,
        recordedAt,
        ...measurementData,
      },
    });

    // Keep existing flows compatible without treating legacy defaults as a measurement.
    if (input.weightKg != null || input.heightCm != null) {
      await tx.userProfile.update({
        where: { id: profile.id },
        data: {
          ...(input.weightKg != null ? { weightKg: input.weightKg } : {}),
          ...(input.heightCm != null ? { heightCm: input.heightCm } : {}),
        },
      });
    }
    return created;
  });

  return toMeasurementItem(measurement);
}

export async function deleteBodyMeasurement(profileId: string, measurementId: string) {
  const result = await prisma.bodyMeasurement.deleteMany({
    where: { id: measurementId, userProfileId: profileId },
  });
  return result.count > 0;
}
