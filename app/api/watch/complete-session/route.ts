import { NextResponse } from "next/server";
import { completeWatchSession } from "@/src/server/watch-mobile";

export async function POST(request: Request) {
  const body = await request.json();
  const sessionId = String(body.sessionId ?? "").trim();
  if (!sessionId) return NextResponse.json({ error: "missing_session_id" }, { status: 400 });

  const payload = await completeWatchSession(sessionId);
  if (!payload) return NextResponse.json({ error: "session_not_found" }, { status: 404 });
  return NextResponse.json(payload);
}

