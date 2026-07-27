import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { skipWatchRest } from "@/src/server/watch-mobile";
import { requireWatchAccess } from "@/src/server/watch-auth";

export async function POST(request: Request) {
  const access = await requireWatchAccess(request);
  if (!access.ok) return access.response;

  const body = await request.json();
  const sessionId = String(body.sessionId ?? "").trim();
  if (!sessionId) return NextResponse.json({ error: "missing_session_id" }, { status: 400 });

  const payload = await skipWatchRest(sessionId, access.userProfileId);
  if (!payload) return NextResponse.json({ error: "session_not_found" }, { status: 404 });
  revalidatePath("/workout");
  revalidatePath("/dashboard");
  revalidatePath("/history");
  return NextResponse.json({ payload });
}
