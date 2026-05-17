import { NextResponse } from "next/server";
import { ingestSamsungHealthMetrics, type SamsungMetricInput } from "@/src/server/samsung-health-sync";

type SyncBody = {
  records?: SamsungMetricInput[];
};

function isAuthorized(request: Request) {
  const expected = process.env.SAMSUNG_SYNC_TOKEN?.trim();
  if (!expected) return false;
  const token = request.headers.get("x-sync-token")?.trim() || "";
  return token.length > 0 && token === expected;
}

export async function POST(request: Request) {
  if (!process.env.SAMSUNG_SYNC_TOKEN?.trim()) {
    return NextResponse.json(
      { ok: false, error: "server_missing_samsung_sync_token" },
      { status: 500 },
    );
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
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

  const result = await ingestSamsungHealthMetrics(records);
  return NextResponse.json({
    ok: true,
    provider: "samsung_health",
    ...result,
  });
}

