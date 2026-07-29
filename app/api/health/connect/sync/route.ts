import { NextResponse } from "next/server";
import { ingestHealthMetrics, type SamsungMetricInput } from "@/src/server/samsung-health-sync";
import { requireHealthSyncAccess } from "@/src/server/health-device-auth";

type SyncBody = {
  records?: SamsungMetricInput[];
};

export async function POST(request: Request) {
  const access = await requireHealthSyncAccess(request, "health_connect");
  if (!access.ok) {
    return access.response;
  }

  let body: SyncBody;
  try {
    body = (await request.json()) as SyncBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const records = Array.isArray(body.records) ? body.records : [];
  if (records.length === 0) {
    return NextResponse.json({ ok: false, error: "no_records" }, { status: 400 });
  }

  const result = await ingestHealthMetrics(records, "health_connect", access.userProfileId);
  return NextResponse.json({
    ok: true,
    provider: "health_connect",
    authMode: access.mode,
    ...result,
  });
}
