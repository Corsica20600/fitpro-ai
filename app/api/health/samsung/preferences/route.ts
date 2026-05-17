import { NextResponse } from "next/server";
import { getSamsungAutoSyncPreference, setSamsungAutoSyncPreference } from "@/src/server/samsung-health-preferences";

export async function GET() {
  const autoSyncEnabled = await getSamsungAutoSyncPreference();
  return NextResponse.json({ ok: true, autoSyncEnabled });
}

export async function POST(request: Request) {
  let body: { autoSyncEnabled?: boolean };
  try {
    body = (await request.json()) as { autoSyncEnabled?: boolean };
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (typeof body.autoSyncEnabled !== "boolean") {
    return NextResponse.json({ ok: false, error: "invalid_auto_sync_value" }, { status: 400 });
  }

  const enabled = await setSamsungAutoSyncPreference(body.autoSyncEnabled);
  return NextResponse.json({ ok: true, autoSyncEnabled: enabled });
}

