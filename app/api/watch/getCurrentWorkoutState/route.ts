import { NextResponse } from "next/server";
import { getCurrentWorkoutState } from "@/src/server/workout-sync";
import { requireWatchAccess } from "@/src/server/watch-auth";

export async function GET(request: Request) {
  const access = await requireWatchAccess(request);
  if (!access.ok) return access.response;

  const { searchParams } = new URL(request.url);
  const workoutSessionId = String(searchParams.get("workoutSessionId") ?? "").trim();
  if (!workoutSessionId) return NextResponse.json({ error: "missing_workout_session_id" }, { status: 400 });

  const state = await getCurrentWorkoutState(workoutSessionId);
  if (!state) return NextResponse.json({ error: "session_not_found" }, { status: 404 });

  return NextResponse.json({ state });
}
