import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();

  const sessionId = String(body.sessionId ?? "").trim();
  const exerciseId = String(body.exerciseId ?? "").trim();
  const setIndex = Number(body.setIndex ?? 0);
  const currentExerciseIndex = body.currentExerciseIndex == null ? null : Number(body.currentExerciseIndex);
  const targetReps = Number(body.targetReps ?? 0);
  const actualReps = body.actualReps == null ? null : Number(body.actualReps);
  const actualWeightKg = body.actualWeightKg == null ? null : Number(body.actualWeightKg);
  const restSeconds = Number(body.restSeconds ?? 90);

  if (!sessionId || !exerciseId || !Number.isFinite(setIndex) || setIndex < 1) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const payload = {
    targetRepsMin: Number.isFinite(targetReps) && targetReps > 0 ? targetReps : null,
    targetRepsMax: Number.isFinite(targetReps) && targetReps > 0 ? targetReps : null,
    actualReps: Number.isFinite(actualReps as number) && (actualReps as number) > 0 ? (actualReps as number) : null,
    actualWeightKg: Number.isFinite(actualWeightKg as number) && (actualWeightKg as number) >= 0 ? (actualWeightKg as number) : null,
    restSeconds: Number.isFinite(restSeconds) ? Math.max(0, restSeconds) : 90,
    isCompleted: true,
    completedAt: new Date(),
  };

  const existing = await prisma.workoutSet.findFirst({
    where: { workoutSessionId: sessionId, exerciseId, setIndex },
    orderBy: { createdAt: "desc" },
  });

  const saved = existing
    ? await prisma.workoutSet.update({
        where: { id: existing.id },
        data: payload,
      })
    : await prisma.workoutSet.create({
        data: {
          workoutSessionId: sessionId,
          exerciseId,
          setIndex,
          ...payload,
        },
      });

  await prisma.watchSession.upsert({
    where: { workoutSessionId: sessionId },
    update: {
      currentExerciseIndex: Number.isFinite(currentExerciseIndex as number) ? Math.max(0, Math.floor(currentExerciseIndex as number)) : undefined,
      currentSetIndex: Math.max(1, saved.setIndex + 1),
      status: "ACTIVE",
      lastSyncAt: new Date(),
    },
    create: {
      workoutSessionId: sessionId,
      currentExerciseIndex: Number.isFinite(currentExerciseIndex as number) ? Math.max(0, Math.floor(currentExerciseIndex as number)) : 0,
      currentSetIndex: Math.max(1, saved.setIndex + 1),
      status: "ACTIVE",
      lastSyncAt: new Date(),
    },
  });

  return NextResponse.json({
    set: {
      id: saved.id,
      exerciseId: saved.exerciseId,
      setIndex: saved.setIndex,
      targetRepsMin: saved.targetRepsMin,
      actualReps: saved.actualReps,
      actualWeightKg: saved.actualWeightKg,
      createdAt: saved.createdAt.toISOString(),
    },
  });
}
