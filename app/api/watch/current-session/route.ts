import { NextResponse } from "next/server";
import { getWatchPayload } from "@/src/server/watch-mobile";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = String(searchParams.get("sessionId") ?? "").trim();
  const payload = await getWatchPayload(sessionId || undefined);
  if (!payload) return NextResponse.json({ error: "session_not_found" }, { status: 404 });
  return NextResponse.json(payload);
}

