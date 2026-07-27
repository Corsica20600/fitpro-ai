import { NextResponse } from "next/server";
import { ingestHealthMetrics, type SamsungMetricInput } from "@/src/server/samsung-health-sync";

type SyncBody = {
  records?: SamsungMetricInput[];
};

function getExpectedToken() {
  return process.env.HEALTH_CONNECT_SYNC_TOKEN?.trim() || process.env.SAMSUNG_SYNC_TOKEN?.trim() || "";
}

function isAuthorized(request: Request) {
  const expected = getExpectedToken();
  const token = request.headers.get("x-sync-token")?.trim() || "";
  return expected.length > 0 && token.length > 0 && token === expected;
}

export async function POST(request: Request) {
  if (!getExpectedToken()) {
    return NextResponse.json(
      { ok: false, error: "server_missing_health_connect_sync_token" },
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

  const result = await ingestHealthMetrics(records, "health_connect");
  return NextResponse.json({
    ok: true,
    provider: "health_connect",
    ...result,
  });
}
