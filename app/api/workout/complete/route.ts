import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/src/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  const sessionId = String(body.sessionId ?? "").trim();
  const forceComplete = Boolean(body.forceComplete);

  if (!sessionId) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const session = await prisma.workoutSession.findUnique({
    where: { id: sessionId },
    include: {
      sets: { select: { exerciseId: true } },
      program: {
        include: {
          days: {
            include: {
              exercises: {
                select: {
                  id: true,
                  exerciseId: true,
                  repsMin: true,
                  repsMax: true,
                  restSeconds: true,
                  sets: true,
                  orderIndex: true,
                  exercise: { select: { name: true, nameFr: true } },
                },
                orderBy: { orderIndex: "asc" },
              },
            },
            orderBy: { dayIndex: "asc" },
          },
        },
      },
    },
  });
  if (!session) {
    return NextResponse.json({ error: "session_not_found" }, { status: 404 });
  }

  const day = session.program
    ? (session.programDayId
      ? (session.program.days.find((item) => item.id === session.programDayId) ?? session.program.days[0] ?? null)
      : (session.program.days[0] ?? null))
    : null;

  const doneByExercise = new Map<string, number>();
  for (const set of session.sets) {
    doneByExercise.set(set.exerciseId, (doneByExercise.get(set.exerciseId) ?? 0) + 1);
  }

  const missingSets = day && day.exercises.length > 0
    ? day.exercises
        .map((exercise) => {
          const planned = Math.max(1, exercise.sets ?? 1);
          const done = doneByExercise.get(exercise.exerciseId) ?? 0;
          if (done >= planned) return null;
          return {
            exerciseId: exercise.exerciseId,
            programExerciseId: exercise.id,
            exerciseName: exercise.exercise.nameFr || exercise.exercise.name,
            plannedSets: planned,
            doneSets: done,
            missingSets: planned - done,
            repsMin: exercise.repsMin,
            repsMax: exercise.repsMax,
            restSeconds: exercise.restSeconds,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item != null)
    : [];

  if (missingSets.length > 0 && !forceComplete) {
    return NextResponse.json(
      {
        error: "missing_sets",
        missingSets,
      },
      { status: 409 },
    );
  }

  if (missingSets.length > 0 && forceComplete) {
    for (const missing of missingSets) {
      const existingForExercise = await prisma.workoutSet.findMany({
        where: { workoutSessionId: sessionId, exerciseId: missing.exerciseId },
        orderBy: [{ setIndex: "asc" }, { createdAt: "asc" }],
      });
      const lastInSession = existingForExercise[existingForExercise.length - 1] ?? null;
      const lastKnown = await prisma.workoutSet.findFirst({
        where: {
          exerciseId: missing.exerciseId,
          isCompleted: true,
          actualReps: { not: null },
          actualWeightKg: { not: null },
        },
        orderBy: [{ completedAt: "desc" }, { createdAt: "desc" }],
        select: { actualReps: true, actualWeightKg: true, targetRepsMin: true, restSeconds: true },
      });

      const reps = lastInSession?.actualReps ?? lastInSession?.targetRepsMin ?? lastKnown?.actualReps ?? lastKnown?.targetRepsMin ?? missing.repsMin ?? missing.repsMax ?? 10;
      const weight = lastInSession?.actualWeightKg ?? lastKnown?.actualWeightKg ?? 0;
      const restSeconds = lastInSession?.restSeconds ?? lastKnown?.restSeconds ?? missing.restSeconds ?? 90;

      for (let setIndex = missing.doneSets + 1; setIndex <= missing.plannedSets; setIndex += 1) {
        await prisma.workoutSet.create({
          data: {
            workoutSessionId: sessionId,
            exerciseId: missing.exerciseId,
            programExerciseId: missing.programExerciseId,
            setIndex,
            targetRepsMin: missing.repsMin ?? reps,
            targetRepsMax: missing.repsMax ?? missing.repsMin ?? reps,
            actualReps: reps,
            targetWeightKg: weight,
            actualWeightKg: weight,
            restSeconds,
            isCompleted: true,
            completedAt: new Date(),
          },
        });
      }
    }
  }

  const endedAt = new Date();
  const durationSeconds = session.startedAt
    ? Math.max(60, Math.floor((endedAt.getTime() - session.startedAt.getTime()) / 1000))
    : null;

  await prisma.workoutSession.update({
    where: { id: sessionId },
    data: {
      status: "COMPLETED",
      endedAt,
      durationSeconds,
    },
  });

  await prisma.watchSession.updateMany({
    where: { workoutSessionId: sessionId },
    data: {
      status: "COMPLETED",
      lastSyncAt: new Date(),
    },
  });

  const fullSets = await prisma.workoutSet.findMany({
    where: { workoutSessionId: sessionId },
    select: { exerciseId: true, actualReps: true, actualWeightKg: true },
  });
  const exercisesCount = new Set(fullSets.map((set) => set.exerciseId)).size;
  const setsCount = fullSets.length;
  const volumeTotal = fullSets.reduce((acc, set) => acc + ((set.actualReps ?? 0) * (set.actualWeightKg ?? 0)), 0);

  revalidatePath("/workout");
  revalidatePath("/dashboard");
  revalidatePath("/history");

  return NextResponse.json({
    ok: true,
    summary: {
      durationSeconds,
      exercisesCount,
      setsCount,
      volumeTotal,
    },
  });
}
