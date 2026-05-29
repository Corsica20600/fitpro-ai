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
                  exerciseId: true,
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

  if (!forceComplete && session.program) {
    const day = session.programDayId
      ? (session.program.days.find((item) => item.id === session.programDayId) ?? session.program.days[0] ?? null)
      : (session.program.days[0] ?? null);

    if (day && day.exercises.length > 0) {
      const doneByExercise = new Map<string, number>();
      for (const set of session.sets) {
        doneByExercise.set(set.exerciseId, (doneByExercise.get(set.exerciseId) ?? 0) + 1);
      }

      const missingSets = day.exercises
        .map((exercise) => {
          const planned = Math.max(1, exercise.sets ?? 1);
          const done = doneByExercise.get(exercise.exerciseId) ?? 0;
          if (done >= planned) return null;
          return {
            exerciseId: exercise.exerciseId,
            exerciseName: exercise.exercise.nameFr || exercise.exercise.name,
            plannedSets: planned,
            doneSets: done,
            missingSets: planned - done,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item != null);

      if (missingSets.length > 0) {
        return NextResponse.json(
          {
            error: "missing_sets",
            missingSets,
          },
          { status: 409 },
        );
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

  const exercisesCount = new Set(session.sets.map((set) => set.exerciseId)).size;
  const setsCount = session.sets.length;
  const fullSets = await prisma.workoutSet.findMany({
    where: { workoutSessionId: sessionId },
    select: { actualReps: true, actualWeightKg: true },
  });
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
