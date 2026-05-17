import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getOrCreateDemoProfile } from "@/src/server/fitness-queries";
import { getSamsungAutoSyncPreference } from "@/src/server/samsung-health-preferences";

export async function GET() {
  const profile = await getOrCreateDemoProfile();
  const latest = await prisma.progressMetric.findFirst({
    where: {
      userProfileId: profile.id,
      metricType: "PERFORMANCE",
      notes: { contains: "\"provider\":\"samsung_health\"" },
    },
    orderBy: { measuredAt: "desc" },
  });

  const autoSyncEnabled = await getSamsungAutoSyncPreference();

  return NextResponse.json({
    ok: true,
    configured: Boolean(process.env.SAMSUNG_SYNC_TOKEN?.trim()),
    lastSyncMetricAt: latest?.measuredAt?.toISOString() ?? null,
    autoSyncEnabled,
  });
}
