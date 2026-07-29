import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getOrCreateDemoProfile } from "@/src/server/fitness-queries";
import { parseSessionNotesMeta, serializeSessionNotesMeta } from "@/src/server/session-exercise-replacements";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as {
    sessionId?: string;
    exerciseId?: string;
    programExerciseId?: string | null;
    setIndex?: number;
    targetReps?: number | null;
    targetWeightKg?: number | null;
    currentExerciseIndex?: number;
    currentSetIndex?: number;
  };

  const sessionId = String(body.sessionId ?? "").trim();
  const exerciseId = String(body.exerciseId ?? "").trim();
  const programExerciseId = String(body.programExerciseId ?? "").trim();
  const setIndex = Math.max(1, Math.floor(Number(body.setIndex ?? 1)));
  const targetReps = body.targetReps == null ? null : Math.max(1, Math.floor(Number(body.targetReps)));
  const targetWeightKg = body.targetWeightKg == null ? null : Math.max(0, Number(body.targetWeightKg));

  if (!sessionId || !exerciseId || !Number.isFinite(setIndex)) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }
  if ((targetReps != null && !Number.isFinite(targetReps)) || (targetWeightKg != null && !Number.isFinite(targetWeightKg))) {
    return NextResponse.json({ error: "invalid_target" }, { status: 400 });
  }

  const profile = await getOrCreateDemoProfile();
  const session = await prisma.workoutSession.findFirst({
    where: { id: sessionId, userProfileId: profile.id, status: "IN_PROGRESS" },
    include: { watchSession: true },
  });
  if (!session) return NextResponse.json({ error: "session_not_found" }, { status: 404 });

  const key = programExerciseId || `exercise:${exerciseId}`;
  const meta = parseSessionNotesMeta(session.notes);
  const liveTargets = {
    ...(meta.liveTargets ?? {}),
    [key]: {
      exerciseId,
      setIndex,
      targetReps,
      targetWeightKg,
      updatedAt: new Date().toISOString(),
    },
  };

  await prisma.workoutSession.update({
    where: { id: session.id },
    data: { notes: serializeSessionNotesMeta({ ...meta, liveTargets }) },
  });

  await prisma.watchSession.upsert({
    where: { workoutSessionId: session.id },
    update: {
      currentExerciseIndex: Math.max(0, Math.floor(Number(body.currentExerciseIndex ?? session.watchSession?.currentExerciseIndex ?? 0))),
      currentSetIndex: Math.max(1, Math.floor(Number(body.currentSetIndex ?? setIndex))),
      status: "ACTIVE",
      lastSyncAt: new Date(),
    },
    create: {
      workoutSessionId: session.id,
      currentExerciseIndex: Math.max(0, Math.floor(Number(body.currentExerciseIndex ?? 0))),
      currentSetIndex: Math.max(1, Math.floor(Number(body.currentSetIndex ?? setIndex))),
      status: "ACTIVE",
      lastSyncAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
