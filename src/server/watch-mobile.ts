import { prisma } from "@/src/lib/prisma";
import { getOrCreateDemoProfile } from "@/src/server/fitness-queries";

const DEFAULT_REPS = [12, 10, 10];

type WatchPayload = {
  sessionId: string;
  exerciseName: string;
  exerciseIndex: number;
  totalExercises: number;
  setIndex: number;
  totalSets: number;
  targetReps: number;
  weight: number | null;
  restRemaining: number;
  status: string;
};

type OrderedExercise = {
  exerciseId: string;
  exerciseName: string;
  totalSets: number;
  targetReps: number;
  restSeconds: number;
};

async function resolveSession(sessionId?: string) {
  if (sessionId) {
    return prisma.workoutSession.findUnique({
      where: { id: sessionId },
      include: {
        watchSession: true,
        sets: {
          include: { exercise: { select: { id: true, name: true, nameFr: true } } },
          orderBy: [{ createdAt: "asc" }, { setIndex: "asc" }],
        },
      },
    });
  }

  const profile = await getOrCreateDemoProfile();
  return prisma.workoutSession.findFirst({
    where: { userProfileId: profile.id, status: "IN_PROGRESS" },
    include: {
      watchSession: true,
      sets: {
        include: { exercise: { select: { id: true, name: true, nameFr: true } } },
        orderBy: [{ createdAt: "asc" }, { setIndex: "asc" }],
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

async function getOrderedExercisesForSession(session: { id: string; programId: string | null; sets: Array<{ exerciseId: string; exercise: { id: string; name: string; nameFr: string | null } }> }) {
  if (session.programId) {
    const program = await prisma.program.findUnique({
      where: { id: session.programId },
      include: {
        days: {
          orderBy: { dayIndex: "asc" },
          include: {
            exercises: {
              orderBy: { orderIndex: "asc" },
              include: {
                exercise: {
                  select: { id: true, name: true, nameFr: true },
                },
              },
            },
          },
        },
      },
    });

    if (program) {
      const dayForToday = program.days[0] ?? null;

      if (dayForToday) {
        const fromProgramDay = dayForToday.exercises.map((item) => ({
          exerciseId: item.exerciseId,
          exerciseName: item.exercise.nameFr || item.exercise.name,
          totalSets: Math.max(1, item.sets ?? 3),
          targetReps: item.repsMin ?? item.repsMax ?? DEFAULT_REPS[0],
          restSeconds: item.restSeconds ?? 90,
        }));
        if (fromProgramDay.length > 0) return fromProgramDay;
      }
    }
  }

  const distinctFromSets = new Map<string, OrderedExercise>();
  for (const set of session.sets) {
    if (!distinctFromSets.has(set.exerciseId)) {
      distinctFromSets.set(set.exerciseId, {
        exerciseId: set.exerciseId,
        exerciseName: set.exercise.nameFr || set.exercise.name,
        totalSets: 3,
        targetReps: DEFAULT_REPS[0],
        restSeconds: 90,
      });
    }
  }
  if (distinctFromSets.size > 0) return [...distinctFromSets.values()];

  const fallback = await prisma.exercise.findMany({
    where: { isActive: true },
    select: { id: true, name: true, nameFr: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
    take: 6,
  });
  return fallback.map((item) => ({
    exerciseId: item.id,
    exerciseName: item.nameFr || item.name,
    totalSets: 3,
    targetReps: DEFAULT_REPS[0],
    restSeconds: 90,
  }));
}

export async function getWatchPayload(sessionId?: string): Promise<WatchPayload | null> {
  const session = await resolveSession(sessionId);
  if (!session) return null;

  const ordered = await getOrderedExercisesForSession(session);
  const totalExercises = Math.max(1, ordered.length);
  const exerciseIndexRaw = session.watchSession?.currentExerciseIndex ?? 0;
  const exerciseIndex = Math.max(0, Math.min(totalExercises - 1, exerciseIndexRaw));
  const currentExercise = ordered[exerciseIndex] ?? ordered[0];
  const setIndex = Math.max(1, session.watchSession?.currentSetIndex ?? 1);
  const totalSets = Math.max(1, currentExercise?.totalSets ?? 3);
  const targetReps = currentExercise?.targetReps ?? (DEFAULT_REPS[Math.min(totalSets - 1, setIndex - 1)] ?? DEFAULT_REPS[0]);

  const latestSetForCurrent = await prisma.workoutSet.findFirst({
    where: { workoutSessionId: session.id, exerciseId: currentExercise.exerciseId, setIndex },
    orderBy: { createdAt: "desc" },
  });
  const latestCompletedSet = await prisma.workoutSet.findFirst({
    where: { workoutSessionId: session.id, isCompleted: true, completedAt: { not: null } },
    orderBy: [{ completedAt: "desc" }, { createdAt: "desc" }],
  });
  const completedAtMs = latestCompletedSet?.completedAt ? latestCompletedSet.completedAt.getTime() : null;
  const nowMs = Date.now();
  const configuredRest = Math.max(0, latestCompletedSet?.restSeconds ?? currentExercise.restSeconds ?? 90);
  const restRemaining = completedAtMs == null
    ? configuredRest
    : Math.max(0, configuredRest - Math.floor((nowMs - completedAtMs) / 1000));

  return {
    sessionId: session.id,
    exerciseName: currentExercise.exerciseName,
    exerciseIndex: exerciseIndex + 1,
    totalExercises,
    setIndex: Math.min(setIndex, totalSets),
    totalSets,
    targetReps,
    weight: latestSetForCurrent?.actualWeightKg ?? latestCompletedSet?.actualWeightKg ?? null,
    restRemaining,
    status: session.status,
  };
}

export async function validateWatchSet(input: {
  sessionId: string;
  actualReps?: number | null;
  weight?: number | null;
}) {
  const session = await resolveSession(input.sessionId);
  if (!session) return null;
  const ordered = await getOrderedExercisesForSession(session);
  const exerciseIndex = Math.max(0, Math.min(ordered.length - 1, session.watchSession?.currentExerciseIndex ?? 0));
  const currentExercise = ordered[exerciseIndex];
  if (!currentExercise) return null;
  const setIndex = Math.max(1, session.watchSession?.currentSetIndex ?? 1);
  const totalSetsForExercise = Math.max(1, currentExercise.totalSets ?? 1);

  const existing = await prisma.workoutSet.findFirst({
    where: { workoutSessionId: session.id, exerciseId: currentExercise.exerciseId, setIndex },
    orderBy: { createdAt: "desc" },
  });

  const payload = {
    targetRepsMin: currentExercise.targetReps,
    targetRepsMax: currentExercise.targetReps,
    actualReps: input.actualReps == null ? null : Math.max(1, Math.floor(input.actualReps)),
    actualWeightKg: input.weight == null ? null : Math.max(0, input.weight),
    restSeconds: currentExercise.restSeconds,
    isCompleted: true,
    completedAt: new Date(),
  };

  if (existing) {
    await prisma.workoutSet.update({ where: { id: existing.id }, data: payload });
  } else {
    await prisma.workoutSet.create({
      data: {
        workoutSessionId: session.id,
        exerciseId: currentExercise.exerciseId,
        setIndex,
        ...payload,
      },
    });
  }

  const isExerciseFinished = setIndex >= totalSetsForExercise;
  const isLastExercise = exerciseIndex >= Math.max(0, ordered.length - 1);
  const nextExerciseIndex = isExerciseFinished && !isLastExercise ? exerciseIndex + 1 : exerciseIndex;
  const nextSetIndex = isExerciseFinished ? 1 : setIndex + 1;

  await prisma.watchSession.upsert({
    where: { workoutSessionId: session.id },
    update: {
      currentExerciseIndex: nextExerciseIndex,
      currentSetIndex: nextSetIndex,
      status: "ACTIVE",
      lastSyncAt: new Date(),
    },
    create: {
      workoutSessionId: session.id,
      currentExerciseIndex: nextExerciseIndex,
      currentSetIndex: nextSetIndex,
      status: "ACTIVE",
      lastSyncAt: new Date(),
    },
  });

  return getWatchPayload(session.id);
}

export async function nextWatchExercise(sessionId: string) {
  const state = await getWatchPayload(sessionId);
  if (!state) return null;
  await prisma.watchSession.upsert({
    where: { workoutSessionId: state.sessionId },
    update: {
      currentExerciseIndex: state.exerciseIndex,
      currentSetIndex: 1,
      status: "ACTIVE",
      lastSyncAt: new Date(),
    },
    create: {
      workoutSessionId: state.sessionId,
      currentExerciseIndex: state.exerciseIndex,
      currentSetIndex: 1,
      status: "ACTIVE",
      lastSyncAt: new Date(),
    },
  });
  return getWatchPayload(state.sessionId);
}

export async function previousWatchExercise(sessionId: string) {
  const state = await getWatchPayload(sessionId);
  if (!state) return null;
  await prisma.watchSession.upsert({
    where: { workoutSessionId: state.sessionId },
    update: {
      currentExerciseIndex: Math.max(0, state.exerciseIndex - 2),
      currentSetIndex: 1,
      status: "ACTIVE",
      lastSyncAt: new Date(),
    },
    create: {
      workoutSessionId: state.sessionId,
      currentExerciseIndex: Math.max(0, state.exerciseIndex - 2),
      currentSetIndex: 1,
      status: "ACTIVE",
      lastSyncAt: new Date(),
    },
  });
  return getWatchPayload(state.sessionId);
}

export async function skipWatchRest(sessionId: string) {
  const state = await getWatchPayload(sessionId);
  if (!state) return null;
  const latestCompletedSet = await prisma.workoutSet.findFirst({
    where: { workoutSessionId: state.sessionId, isCompleted: true, completedAt: { not: null } },
    orderBy: [{ completedAt: "desc" }, { createdAt: "desc" }],
  });
  if (latestCompletedSet) {
    await prisma.workoutSet.update({
      where: { id: latestCompletedSet.id },
      data: { restSeconds: 0 },
    });
  }
  return { ...state, restRemaining: 0 };
}

export async function completeWatchSession(sessionId: string) {
  const state = await getWatchPayload(sessionId);
  if (!state) return null;
  const endedAt = new Date();
  const started = await prisma.workoutSession.findUnique({ where: { id: state.sessionId }, select: { startedAt: true } });
  await prisma.workoutSession.update({
    where: { id: state.sessionId },
    data: {
      status: "COMPLETED",
      endedAt,
      durationSeconds: started?.startedAt ? Math.max(60, Math.floor((endedAt.getTime() - started.startedAt.getTime()) / 1000)) : null,
    },
  });
  await prisma.watchSession.updateMany({
    where: { workoutSessionId: state.sessionId },
    data: { status: "COMPLETED", lastSyncAt: new Date() },
  });
  const final = await getWatchPayload(state.sessionId);
  return final ? { ...final, status: "COMPLETED", restRemaining: 0 } : null;
}
