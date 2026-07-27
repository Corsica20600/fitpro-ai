import { prisma } from "@/src/lib/prisma";
import { getOrCreateDemoProfile } from "@/src/server/fitness-queries";

export type SamsungMetricInput = {
  metric: "steps" | "heart_rate" | "sleep_minutes" | "calories" | "distance_m";
  value: number;
  measuredAt: string;
  sourceDevice?: string;
};

function toUnit(metric: SamsungMetricInput["metric"]) {
  if (metric === "steps") return "steps";
  if (metric === "heart_rate") return "bpm";
  if (metric === "sleep_minutes") return "min";
  if (metric === "calories") return "kcal";
  if (metric === "distance_m") return "m";
  return "raw";
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function parseMeasuredAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export async function ingestSamsungHealthMetrics(records: SamsungMetricInput[]) {
  const profile = await getOrCreateDemoProfile();
  const valid = records.filter((item) => {
    if (!item || typeof item !== "object") return false;
    if (!isFiniteNumber(item.value)) return false;
    if (!parseMeasuredAt(item.measuredAt)) return false;
    return true;
  });

  if (valid.length === 0) {
    return { inserted: 0, ignored: records.length };
  }

  await prisma.progressMetric.createMany({
    data: valid.map((item) => ({
      userProfileId: profile.id,
      metricType: "PERFORMANCE",
      value: item.value,
      unit: toUnit(item.metric),
      measuredAt: parseMeasuredAt(item.measuredAt) ?? new Date(),
      notes: JSON.stringify({
        provider: "samsung_health",
        metric: item.metric,
        sourceDevice: item.sourceDevice ?? null,
      }),
    })),
  });

  await prisma.integrationConnection.upsert({
    where: { userProfileId_provider: { userProfileId: profile.id, provider: "SAMSUNG_HEALTH" } },
    update: {
      status: "CONNECTED",
      displayName: "Samsung Health",
      scopes: ["steps", "heart_rate", "sleep_minutes", "calories", "distance_m"],
      lastSyncAt: new Date(),
      connectedAt: new Date(),
      disconnectedAt: null,
      metadata: {
        source: "private_android_bridge",
        inserted: valid.length,
      },
    },
    create: {
      userProfileId: profile.id,
      provider: "SAMSUNG_HEALTH",
      status: "CONNECTED",
      displayName: "Samsung Health",
      scopes: ["steps", "heart_rate", "sleep_minutes", "calories", "distance_m"],
      lastSyncAt: new Date(),
      connectedAt: new Date(),
      metadata: {
        source: "private_android_bridge",
        inserted: valid.length,
      },
    },
  });

  return {
    inserted: valid.length,
    ignored: records.length - valid.length,
  };
}
