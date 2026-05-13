import { NextResponse } from "next/server";
import { goToNextExercise } from "@/src/server/workout-sync";

export async function POST(request: Request) {
  const body = await request.json();
  const workoutSessionId = String(body.workoutSessionId ?? "").trim();
  if (!workoutSessionId) return NextResponse.json({ error: "missing_workout_session_id" }, { status: 400 });

  const state = await goToNextExercise(workoutSessionId);
  if (!state) return NextResponse.json({ error: "session_not_found" }, { status: 404 });

  return NextResponse.json({ state });
}
