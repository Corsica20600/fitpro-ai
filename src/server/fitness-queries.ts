import { prisma } from "@/src/lib/prisma";

const DEMO_EMAIL = "demo@fitai.local";

type ExerciseWithFrCompat = {
  id: string;
  slug: string;
  name: string;
  nameFr: string | null;
  category: string;
  movementType: string;
  primaryMuscles: string[];
  primaryMusclesFr: string[];
  secondaryMuscles: string[];
  equipment: string[];
  equipmentFr: string[];
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  objectives: string[];
  shortTechnicalCues: string[];
  detailedInstructions: string;
  instructionsFr: string | null;
  commonMistakes: string[];
  commonMistakesFr: string[];
  variants: string[];
  alternatives: string[];
  tags: string[];
  contraindications: string[];
  primaryAnimationPath: string | null;
  fallbackImagePath: string;
  fallbackThumbnailPath: string;
  fallbackAnimationPath: string;
  isCompound: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  media: Array<{
    id: string;
    type: "IMAGE" | "THUMBNAIL" | "ANIMATION";
    format: string;
    publicUrl: string;
    url: string | null;
    storagePath: string;
    mimeType: string | null;
    width: number | null;
    height: number | null;
    durationSeconds: number | null;
    isLoop: boolean;
    sourceName: string | null;
    sourceUrl: string | null;
    license: string | null;
    isPrimary: boolean;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
    exerciseId: string;
  }>;
};

export type SessionWorkoutExercise = ExerciseWithFrCompat & {
  plan?: {
    sets: number | null;
    repsMin: number | null;
    repsMax: number | null;
    plannedWeightKg: number | null;
    restSeconds: number | null;
    orderDayIndex: number | null;
    orderExerciseIndex: number | null;
    programExerciseId: string | null;
  };
};

function parseWeightKgFromText(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = value.match(/(\d+(?:[.,]\d+)?)/);
  if (!match) return null;
  const parsed = Number(match[1].replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function isMissingColumnError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("does not exist in the current database") ||
    message.includes("does not exist") ||
    message.includes("Unknown field") ||
    message.includes("Unknown argument") ||
    message.includes("P2022")
  );
}

function toFrCompat<T extends {
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string[];
  name: string;
  detailedInstructions: string;
  commonMistakes: string[];
}>(exercise: T): T & {
  nameFr: string | null;
  primaryMusclesFr: string[];
  equipmentFr: string[];
  instructionsFr: string | null;
  commonMistakesFr: string[];
} {
  return {
    ...exercise,
    nameFr: null,
    primaryMusclesFr: [],
    equipmentFr: [],
    instructionsFr: null,
    commonMistakesFr: [],
  };
}

function getParisWeekStart(input = new Date()) {
  const date = new Date(input);
  const day = date.getDay();
  const diffToMonday = day === 0 ? 6 : day - 1;
  date.setDate(date.getDate() - diffToMonday);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getPreviousWeekStart(input = new Date()) {
  const date = getParisWeekStart(input);
  date.setDate(date.getDate() - 7);
  return date;
}

function formatUserFirstName(displayName: string) {
  return displayName.trim().split(/\s+/)[0] ?? displayName;
}

function getSessionVolume(sets: Array<{ actualReps: number | null; actualWeightKg: number | null }>) {
  return sets.reduce((acc, set) => acc + (set.actualReps ?? 0) * (set.actualWeightKg ?? 0), 0);
}

function getLevelFromXp(totalXp: number) {
  let level = 1;
  let xpSpent = 0;
  let nextRequirement = 300;

  while (totalXp >= xpSpent + nextRequirement) {
    xpSpent += nextRequirement;
    level += 1;
    nextRequirement = 300 + (level - 1) * 120;
  }

  const xpInLevel = totalXp - xpSpent;
  const progressPercent = Math.round((xpInLevel / nextRequirement) * 100);
  const sessionsToNextLevel = Math.max(1, Math.ceil((nextRequirement - xpInLevel) / 100));

  return {
    level,
    totalXp,
    xpInLevel,
    xpForNextLevel: nextRequirement,
    progressPercent,
    sessionsToNextLevel,
  };
}

function getCompletedWeeksStreak(sessions: Array<{ startedAt: Date | null; createdAt: Date }>, now = new Date()) {
  const weekStarts = new Set(
    sessions.map((session) => getParisWeekStart(session.startedAt ?? session.createdAt).getTime()),
  );
  let cursor = getParisWeekStart(now);
  let streak = 0;

  while (weekStarts.has(cursor.getTime())) {
    streak += 1;
    cursor = new Date(cursor);
    cursor.setDate(cursor.getDate() - 7);
  }

  return streak;
}

function getCoachInsight(input: {
  weeklySessions: number;
  weeklyGoal: number | null;
  weeklyVolume: number;
  previousWeeklyVolume: number;
  streakWeeks: number;
  lastSessionAt: Date | null;
  mostFrequentExerciseName: string | null;
}) {
  const daysSinceLastSession = input.lastSessionAt
    ? Math.floor((Date.now() - input.lastSessionAt.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const weeklyGoal = input.weeklyGoal ?? 3;
  const volumeDelta =
    input.previousWeeklyVolume > 0
      ? ((input.weeklyVolume - input.previousWeeklyVolume) / input.previousWeeklyVolume) * 100
      : null;

  if (!input.lastSessionAt || (daysSinceLastSession != null && daysSinceLastSession >= 7)) {
    return {
      title: "Reprise intelligente",
      message: "Aucune séance récente détectée. Lance une séance légère pour relancer la machine sans te cramer.",
      tone: "warning" as const,
    };
  }

  if (volumeDelta != null && volumeDelta >= 45) {
    return {
      title: "Volume en forte hausse",
      message: "Ta semaine monte vite en volume. Garde une exécution propre et surveille la récupération.",
      tone: "orange" as const,
    };
  }

  if (input.weeklySessions >= weeklyGoal) {
    return {
      title: "Objectif semaine atteint",
      message: `Tu as déjà validé ${input.weeklySessions} séances cette semaine. Maintiens le cap avec une séance technique ou mobilité.`,
      tone: "success" as const,
    };
  }

  if (input.streakWeeks >= 2) {
    return {
      title: "Régularité solide",
      message: `Tu tiens une série de ${input.streakWeeks} semaines. Une séance bien placée peut prolonger cette dynamique.`,
      tone: "accent" as const,
    };
  }

  if (input.mostFrequentExerciseName && input.weeklySessions >= 2) {
    return {
      title: "Variation utile",
      message: `${input.mostFrequentExerciseName} revient souvent. Pense à varier l'angle ou le tempo si la séance le permet.`,
      tone: "violet" as const,
    };
  }

  return {
    title: "Objectif accessible",
    message: `Tu as ${input.weeklySessions} séance${input.weeklySessions > 1 ? "s" : ""} cette semaine. Une prochaine séance propre te rapproche de ton rythme cible.`,
    tone: "accent" as const,
  };
}

export async function getOrCreateDemoProfile() {
  const existing = await prisma.userProfile.findUnique({
    where: { email: DEMO_EMAIL },
  });

  if (existing) return existing;

  return prisma.userProfile.create({
    data: {
      displayName: "Athlete Demo",
      email: DEMO_EMAIL,
      trainingLevel: "INTERMEDIATE",
      primaryGoal: "HYPERTROPHY",
      sessionsPerWeek: 4,
      age: 30,
      heightCm: 178,
      weightKg: 78,
    },
  });
}

export async function getExercisesCatalog() {
  return prisma.exercise.findMany({
    where: { isActive: true },
    include: { media: { orderBy: [{ type: "asc" }, { sortOrder: "asc" }] } },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
}

export async function getActiveExercisesCount() {
  return prisma.exercise.count({ where: { isActive: true } });
}

export async function getExerciseFilterOptions() {
  let rows: Array<{
    primaryMuscles: string[];
    primaryMusclesFr: string[];
    equipment: string[];
    equipmentFr: string[];
    difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  }>;

  try {
    rows = await prisma.exercise.findMany({
      where: { isActive: true },
      select: { primaryMuscles: true, primaryMusclesFr: true, equipment: true, equipmentFr: true, difficulty: true },
    });
  } catch (error) {
    if (!isMissingColumnError(error)) throw error;
    const fallbackRows = await prisma.exercise.findMany({
      where: { isActive: true },
      select: { primaryMuscles: true, equipment: true, difficulty: true },
    });
    rows = fallbackRows.map((item) => ({
      ...item,
      primaryMusclesFr: [],
      equipmentFr: [],
    }));
  }

  const muscleSet = new Set<string>();
  const equipmentSet = new Set<string>();
  const difficultySet = new Set<"BEGINNER" | "INTERMEDIATE" | "ADVANCED">();

  for (const row of rows) {
    for (const muscle of (row.primaryMusclesFr.length ? row.primaryMusclesFr : row.primaryMuscles)) muscleSet.add(muscle);
    for (const item of (row.equipmentFr.length ? row.equipmentFr : row.equipment)) equipmentSet.add(item);
    difficultySet.add(row.difficulty);
  }

  return {
    muscles: [...muscleSet].sort((a, b) => a.localeCompare(b, "fr")),
    equipment: [...equipmentSet].sort((a, b) => a.localeCompare(b, "fr")),
    difficulties: (["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const).filter((item) => difficultySet.has(item)),
  };
}

export async function getExercisesCatalogPage(input: {
  search?: string;
  muscle?: string;
  equipment?: string;
  difficulty?: string;
  page?: number;
  pageSize?: number;
}) {
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.max(12, Math.min(60, input.pageSize ?? 24));

  const andClauses: Array<Record<string, unknown>> = [];
  if (input.search) {
    andClauses.push({
      OR: [
        { name: { contains: input.search, mode: "insensitive" as const } },
        { nameFr: { contains: input.search, mode: "insensitive" as const } },
      ],
    });
  }
  if (input.muscle) {
    andClauses.push({
      OR: [
        { primaryMuscles: { has: input.muscle } },
        { primaryMusclesFr: { has: input.muscle } },
      ],
    });
  }
  if (input.equipment) {
    andClauses.push({
      OR: [
        { equipment: { has: input.equipment } },
        { equipmentFr: { has: input.equipment } },
      ],
    });
  }
  if (input.difficulty && ["BEGINNER", "INTERMEDIATE", "ADVANCED"].includes(input.difficulty)) {
    andClauses.push({ difficulty: input.difficulty });
  }

  const where = andClauses.length
    ? { isActive: true, AND: andClauses }
    : { isActive: true };

  let total = 0;
  let exercises: ExerciseWithFrCompat[] = [];

  try {
    const response = await Promise.all([
      prisma.exercise.count({ where }),
      prisma.exercise.findMany({
        where,
        include: { media: { orderBy: [{ type: "asc" }, { sortOrder: "asc" }] } },
        orderBy: [{ name: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    total = response[0];
    exercises = response[1] as ExerciseWithFrCompat[];
  } catch (error) {
    if (!isMissingColumnError(error)) throw error;

    const fallbackClauses: Array<Record<string, unknown>> = [];
    if (input.search) {
      fallbackClauses.push({
        name: { contains: input.search, mode: "insensitive" as const },
      });
    }
    if (input.muscle) {
      fallbackClauses.push({ primaryMuscles: { has: input.muscle } });
    }
    if (input.equipment) {
      fallbackClauses.push({ equipment: { has: input.equipment } });
    }
    if (input.difficulty && ["BEGINNER", "INTERMEDIATE", "ADVANCED"].includes(input.difficulty)) {
      fallbackClauses.push({ difficulty: input.difficulty });
    }

    const fallbackWhere = fallbackClauses.length
      ? { isActive: true, AND: fallbackClauses }
      : { isActive: true };

    const response = await Promise.all([
      prisma.exercise.count({ where: fallbackWhere }),
      prisma.exercise.findMany({
        where: fallbackWhere,
        include: { media: { orderBy: [{ type: "asc" }, { sortOrder: "asc" }] } },
        orderBy: [{ name: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    total = response[0];
    exercises = response[1].map((item) => toFrCompat(item)) as ExerciseWithFrCompat[];
  }

  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    exercises,
  };
}

export async function getExerciseBySlug(slug: string) {
  try {
    return await prisma.exercise.findUnique({
      where: { slug },
      include: { media: { orderBy: [{ type: "asc" }, { sortOrder: "asc" }] } },
    });
  } catch (error) {
    if (!isMissingColumnError(error)) throw error;
    const fallback = await prisma.exercise.findUnique({
      where: { slug },
      include: { media: { orderBy: [{ type: "asc" }, { sortOrder: "asc" }] } },
    });
    return fallback ? toFrCompat(fallback) : null;
  }
}

export async function getProgramsForDemoUser() {
  const profile = await getOrCreateDemoProfile();

  return prisma.program.findMany({
    where: { userProfileId: profile.id },
    include: {
      days: {
        include: {
          exercises: {
            include: { exercise: { include: { media: { orderBy: [{ type: "asc" }, { sortOrder: "asc" }] } } } },
            orderBy: { orderIndex: "asc" },
          },
        },
        orderBy: { dayIndex: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getExerciseOptionsForPrograms(limit = 300) {
  return prisma.exercise.findMany({
    where: { isActive: true },
    select: {
      id: true,
      slug: true,
      name: true,
      nameFr: true,
      primaryAnimationPath: true,
      primaryMuscles: true,
      primaryMusclesFr: true,
      fallbackThumbnailPath: true,
      fallbackImagePath: true,
    },
    orderBy: [{ name: "asc" }],
    take: Math.max(60, Math.min(800, limit)),
  });
}

export async function getWorkoutHistoryForDemoUser() {
  const profile = await getOrCreateDemoProfile();

  return prisma.workoutSession.findMany({
    where: { userProfileId: profile.id },
    include: {
      sets: {
        include: {
          exercise: {
            select: { id: true, name: true, nameFr: true, fallbackThumbnailPath: true, fallbackImagePath: true },
          },
        },
      },
      program: true,
    },
    orderBy: [{ createdAt: "desc" }],
    take: 60,
  });
}

export async function getWorkoutHistorySummaryForDemoUser() {
  const sessions = await getWorkoutHistoryForDemoUser();

  const now = new Date();
  const startOfWeek = new Date(now);
  const day = startOfWeek.getDay();
  const diffToMonday = day === 0 ? 6 : day - 1;
  startOfWeek.setDate(startOfWeek.getDate() - diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  const enriched = sessions.map((session) => {
    const totalVolume = session.sets.reduce((acc, set) => acc + (set.actualReps ?? 0) * (set.actualWeightKg ?? 0), 0);
    const exerciseCount = new Set(session.sets.map((set) => set.exerciseId)).size;
    const setsCount = session.sets.length;
    return {
      ...session,
      totalVolume,
      exerciseCount,
      setsCount,
    };
  });

  const weeklySessions = enriched.filter((session) => (session.startedAt ?? session.createdAt) >= startOfWeek);
  const weeklyVolume = weeklySessions.reduce((acc, item) => acc + item.totalVolume, 0);

  const bestRecentSession = enriched
    .filter((session) => session.status === "COMPLETED")
    .slice(0, 10)
    .sort((a, b) => b.totalVolume - a.totalVolume)[0] ?? null;

  return {
    sessions: enriched,
    stats: {
      weeklyVolume,
      weeklySessionsCount: weeklySessions.length,
      bestRecentSession,
    },
  };
}

export async function getHistoryVisualFallback() {
  const exercise = await prisma.exercise.findFirst({
    where: { isActive: true },
    select: { name: true, nameFr: true, fallbackThumbnailPath: true, fallbackImagePath: true },
    orderBy: { updatedAt: "desc" },
  });

  if (!exercise) return null;
  return {
    title: exercise.nameFr || exercise.name,
    image: exercise.fallbackThumbnailPath || exercise.fallbackImagePath,
  };
}

export async function getWorkoutSessionDetailForDemoUser(sessionId: string) {
  const profile = await getOrCreateDemoProfile();

  const session = await prisma.workoutSession.findFirst({
    where: { id: sessionId, userProfileId: profile.id },
    include: {
      sets: {
        include: {
          exercise: {
            select: {
              id: true,
              name: true,
              nameFr: true,
              primaryMuscles: true,
              primaryMusclesFr: true,
            },
          },
        },
        orderBy: [{ exerciseId: "asc" }, { setIndex: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!session) return null;

  const groupsMap = new Map<string, {
    exerciseId: string;
    exerciseName: string;
    primaryMuscle: string;
    sets: Array<{
      id: string;
      setIndex: number;
      reps: number | null;
      weightKg: number | null;
      volume: number;
    }>;
    totalVolume: number;
  }>();

  for (const set of session.sets) {
    const key = set.exerciseId;
    if (!groupsMap.has(key)) {
      groupsMap.set(key, {
        exerciseId: set.exerciseId,
        exerciseName: set.exercise.nameFr || set.exercise.name,
        primaryMuscle: set.exercise.primaryMusclesFr[0] || set.exercise.primaryMuscles[0] || "Full body",
        sets: [],
        totalVolume: 0,
      });
    }

    const volume = (set.actualReps ?? 0) * (set.actualWeightKg ?? 0);
    const group = groupsMap.get(key)!;
    group.sets.push({
      id: set.id,
      setIndex: set.setIndex,
      reps: set.actualReps,
      weightKg: set.actualWeightKg,
      volume,
    });
    group.totalVolume += volume;
  }

  const exercises = [...groupsMap.values()];
  const totalVolume = exercises.reduce((acc, item) => acc + item.totalVolume, 0);
  const totalSets = exercises.reduce((acc, item) => acc + item.sets.length, 0);

  return {
    session,
    exercises,
    totalVolume,
    totalSets,
    totalExercises: exercises.length,
  };
}

export async function getWorkoutPageData() {
  const profile = await getOrCreateDemoProfile();

  let exercises: ExerciseWithFrCompat[] = [];
  const [programs, currentSession, latestProgramSession] = await Promise.all([
    prisma.program.findMany({
      where: { userProfileId: profile.id, status: { in: ["ACTIVE", "DRAFT"] } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.workoutSession.findFirst({
      where: { userProfileId: profile.id, status: "IN_PROGRESS" },
      include: { sets: { orderBy: { createdAt: "desc" }, take: 20 }, program: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.workoutSession.findFirst({
      where: { userProfileId: profile.id, status: "COMPLETED", programId: { not: null } },
      select: { programId: true },
      orderBy: [{ endedAt: "desc" }, { createdAt: "desc" }],
    }),
  ]);
  const lastPerformedProgramId = latestProgramSession?.programId ?? null;

  try {
    exercises = await prisma.exercise.findMany({
      where: { isActive: true },
      include: { media: { orderBy: [{ type: "asc" }, { sortOrder: "asc" }] } },
      orderBy: [{ category: "asc" }, { name: "asc" }],
      take: 120,
    }) as ExerciseWithFrCompat[];
  } catch (error) {
    if (!isMissingColumnError(error)) throw error;
    const fallbackExercises = await prisma.exercise.findMany({
      where: { isActive: true },
      include: { media: { orderBy: [{ type: "asc" }, { sortOrder: "asc" }] } },
      orderBy: [{ category: "asc" }, { name: "asc" }],
      take: 120,
    });
    exercises = fallbackExercises.map((item) => toFrCompat(item)) as ExerciseWithFrCompat[];
  }

  let sessionExercises: SessionWorkoutExercise[] = [];
  const latestWeightsRows = await prisma.workoutSet.findMany({
    where: {
      workoutSession: { userProfileId: profile.id },
      actualWeightKg: { not: null },
    },
    orderBy: [{ createdAt: "desc" }],
    select: { exerciseId: true, actualWeightKg: true },
    take: 500,
  });
  const latestWeightByExercise = new Map<string, number>();
  for (const row of latestWeightsRows) {
    if (!latestWeightByExercise.has(row.exerciseId) && row.actualWeightKg != null) {
      latestWeightByExercise.set(row.exerciseId, row.actualWeightKg);
    }
  }

  if (currentSession?.programId) {
    const sessionProgram = await prisma.program.findFirst({
      where: { id: currentSession.programId, userProfileId: profile.id },
      include: {
        days: {
          orderBy: { dayIndex: "asc" },
          include: {
            exercises: {
              orderBy: { orderIndex: "asc" },
              include: {
                exercise: {
                  include: { media: { orderBy: [{ type: "asc" }, { sortOrder: "asc" }] } },
                },
              },
            },
          },
        },
      },
    });

    if (sessionProgram) {
      const dayForToday = currentSession.programDayId
        ? (sessionProgram.days.find((day) => day.id === currentSession.programDayId) ?? sessionProgram.days[0] ?? null)
        : (sessionProgram.days[0] ?? null);

      if (dayForToday) {
        sessionExercises = dayForToday.exercises.map((programExercise) => ({
          ...(toFrCompat(programExercise.exercise) as ExerciseWithFrCompat),
          plan: {
            sets: programExercise.sets ?? null,
            repsMin: programExercise.repsMin ?? null,
            repsMax: programExercise.repsMax ?? null,
            plannedWeightKg:
              parseWeightKgFromText(programExercise.repsText) ??
              latestWeightByExercise.get(programExercise.exerciseId) ??
              null,
            restSeconds: programExercise.restSeconds ?? null,
            orderDayIndex: dayForToday.dayIndex,
            orderExerciseIndex: programExercise.orderIndex,
            programExerciseId: programExercise.id,
          },
        }));
      }
    }
  }

  if (sessionExercises.length === 0) {
    const shuffled = [...exercises].sort(() => Math.random() - 0.5);
    sessionExercises = shuffled.slice(0, 6).map((exercise) => ({ ...exercise, plan: undefined }));
  }

  return { profile, programs, exercises, sessionExercises, currentSession, lastPerformedProgramId };
}

export async function getDashboardDataForDemoUser() {
  const profile = await getOrCreateDemoProfile();
  const now = new Date();
  const startOfWeek = getParisWeekStart(now);
  const previousWeekStart = getPreviousWeekStart(now);

  const [programs, currentSession, completedSessions] = await Promise.all([
    prisma.program.findMany({
      where: { userProfileId: profile.id, status: { in: ["ACTIVE", "DRAFT"] } },
      include: {
        days: {
          orderBy: { dayIndex: "asc" },
          include: {
            exercises: {
              orderBy: { orderIndex: "asc" },
              include: {
                exercise: {
                  include: { media: { orderBy: [{ type: "asc" }, { sortOrder: "asc" }] } },
                },
              },
            },
          },
        },
      },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      take: 8,
    }),
    prisma.workoutSession.findFirst({
      where: { userProfileId: profile.id, status: "IN_PROGRESS" },
      include: {
        program: true,
        sets: {
          include: {
            exercise: {
              select: {
                id: true,
                name: true,
                nameFr: true,
                primaryMuscles: true,
                primaryMusclesFr: true,
                fallbackImagePath: true,
                fallbackThumbnailPath: true,
                difficulty: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.workoutSession.findMany({
      where: { userProfileId: profile.id, status: "COMPLETED" },
      include: {
        program: true,
        sets: {
          include: {
            exercise: {
              select: {
                id: true,
                name: true,
                nameFr: true,
                primaryMuscles: true,
                primaryMusclesFr: true,
              },
            },
          },
        },
      },
      orderBy: [{ endedAt: "desc" }, { createdAt: "desc" }],
      take: 120,
    }),
  ]);

  const activeProgram = programs.find((program) => program.status === "ACTIVE") ?? programs[0] ?? null;
  const completedForActiveProgram = activeProgram
    ? completedSessions.filter((session) => session.programId === activeProgram.id).length
    : 0;
  const nextDay = activeProgram?.days.length
    ? activeProgram.days[completedForActiveProgram % activeProgram.days.length]
    : null;
  const nextExercises = nextDay?.exercises ?? [];
  const mainProgramExercise = nextExercises[0] ?? null;
  const mainExerciseFromSession = currentSession?.sets[0]?.exercise ?? null;
  const mainExercise = mainProgramExercise?.exercise ?? mainExerciseFromSession ?? null;
  const workoutTitle = currentSession?.title ?? nextDay?.title ?? activeProgram?.name ?? "Séance libre";
  const workoutImage =
    mainExercise?.fallbackImagePath ||
    mainExercise?.fallbackThumbnailPath ||
    "/media/exercises/air-bike/0.jpg";
  const targetMuscles = [
    ...new Set(
      nextExercises
        .flatMap((item) => item.exercise.primaryMusclesFr.length ? item.exercise.primaryMusclesFr : item.exercise.primaryMuscles)
        .filter(Boolean),
    ),
  ].slice(0, 3);
  const estimatedMinutes = nextExercises.length
    ? Math.max(
        8,
        Math.round(
          nextExercises.reduce(
            (acc, item) => acc + item.sets * ((item.restSeconds ?? 60) + 45),
            0,
          ) / 60,
        ),
      )
    : null;
  const difficulty = activeProgram?.level ?? mainExercise?.difficulty ?? null;

  const sessionsWithStats = completedSessions.map((session) => ({
    ...session,
    date: session.startedAt ?? session.createdAt,
    volume: getSessionVolume(session.sets),
    setCount: session.sets.length,
    exerciseCount: new Set(session.sets.map((set) => set.exerciseId)).size,
  }));

  const weeklySessions = sessionsWithStats.filter((session) => session.date >= startOfWeek);
  const previousWeekSessions = sessionsWithStats.filter(
    (session) => session.date >= previousWeekStart && session.date < startOfWeek,
  );
  const weeklyVolume = weeklySessions.reduce((acc, session) => acc + session.volume, 0);
  const previousWeeklyVolume = previousWeekSessions.reduce((acc, session) => acc + session.volume, 0);
  const weeklyDurationSeconds = weeklySessions.reduce((acc, session) => acc + (session.durationSeconds ?? 0), 0);
  const weeklySetCount = weeklySessions.reduce((acc, session) => acc + session.setCount, 0);
  const weeklyComparisonPercent =
    previousWeeklyVolume > 0 ? Math.round(((weeklyVolume - previousWeeklyVolume) / previousWeeklyVolume) * 100) : null;
  const streakWeeks = getCompletedWeeksStreak(sessionsWithStats, now);

  const exerciseFrequency = new Map<string, { name: string; count: number }>();
  for (const session of sessionsWithStats.slice(0, 20)) {
    for (const set of session.sets) {
      const item = exerciseFrequency.get(set.exerciseId) ?? {
        name: set.exercise.nameFr || set.exercise.name,
        count: 0,
      };
      item.count += 1;
      exerciseFrequency.set(set.exerciseId, item);
    }
  }
  const mostFrequentExercise = [...exerciseFrequency.values()].sort((a, b) => b.count - a.count)[0] ?? null;
  const totalCompletedSessions = sessionsWithStats.length;
  const level = getLevelFromXp(totalCompletedSessions * 100 + streakWeeks * 25);
  const coachInsight = getCoachInsight({
    weeklySessions: weeklySessions.length,
    weeklyGoal: profile.sessionsPerWeek,
    weeklyVolume,
    previousWeeklyVolume,
    streakWeeks,
    lastSessionAt: sessionsWithStats[0]?.date ?? null,
    mostFrequentExerciseName: mostFrequentExercise?.name ?? null,
  });

  return {
    user: {
      firstName: formatUserFirstName(profile.displayName),
      sessionsPerWeek: profile.sessionsPerWeek,
      trainingLevel: profile.trainingLevel,
    },
    activeProgram: activeProgram
      ? {
          id: activeProgram.id,
          name: activeProgram.name,
          level: activeProgram.level,
          goal: activeProgram.goal,
          sessionsPerWeek: activeProgram.sessionsPerWeek,
          status: activeProgram.status,
        }
      : null,
    nextWorkout: activeProgram
      ? {
          programName: activeProgram.name,
          title: workoutTitle,
          image: workoutImage,
          imageAlt: mainExercise ? mainExercise.nameFr || mainExercise.name : workoutTitle,
          mainExerciseName: mainExercise ? mainExercise.nameFr || mainExercise.name : null,
          exerciseCount: nextExercises.length || (currentSession ? new Set(currentSession.sets.map((set) => set.exerciseId)).size : 0),
          targetMuscles,
          estimatedMinutes,
          difficulty,
          isInProgress: Boolean(currentSession),
        }
      : null,
    weeklyStats: {
      sessions: weeklySessions.length,
      volume: weeklyVolume,
      durationSeconds: weeklyDurationSeconds,
      sets: weeklySetCount,
      comparisonPercent: weeklyComparisonPercent,
    },
    previousWeekStats: {
      sessions: previousWeekSessions.length,
      volume: previousWeeklyVolume,
    },
    recentSessions: sessionsWithStats.slice(0, 5).map((session) => ({
      id: session.id,
      title: session.title,
      date: session.date,
      volume: session.volume,
      setCount: session.setCount,
    })),
    streak: {
      weeks: streakWeeks,
    },
    level,
    coachInsight,
  };
}

export async function getProgressDataForDemoUser(selectedExerciseId?: string) {
  const profile = await getOrCreateDemoProfile();
  const exerciseId = (selectedExerciseId ?? "").trim();

  let sessions: Array<{
    id: string;
    title: string;
    startedAt: Date | null;
    createdAt: Date;
    status: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED";
    durationSeconds: number | null;
    sets: Array<{
      exerciseId: string;
      actualReps: number | null;
      actualWeightKg: number | null;
      exercise: { id: string; name: string; nameFr: string | null };
    }>;
  }> = [];

  let exercises: Array<{ id: string; name: string; nameFr: string | null }> = [];

  try {
    const response = await Promise.all([
      prisma.workoutSession.findMany({
        where: { userProfileId: profile.id },
        include: {
          sets: {
            include: {
              exercise: {
                select: { id: true, name: true, nameFr: true },
              },
            },
          },
        },
        orderBy: [{ createdAt: "desc" }],
        take: 150,
      }),
      prisma.exercise.findMany({
        where: { isActive: true },
        select: { id: true, name: true, nameFr: true },
        orderBy: [{ name: "asc" }],
        take: 300,
      }),
    ]);
    sessions = response[0];
    exercises = response[1];
  } catch (error) {
    if (!isMissingColumnError(error)) throw error;

    const response = await Promise.all([
      prisma.workoutSession.findMany({
        where: { userProfileId: profile.id },
        include: {
          sets: {
            include: {
              exercise: {
                select: { id: true, name: true },
              },
            },
          },
        },
        orderBy: [{ createdAt: "desc" }],
        take: 150,
      }),
      prisma.exercise.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: [{ name: "asc" }],
        take: 300,
      }),
    ]);

    sessions = response[0].map((session) => ({
      ...session,
      sets: session.sets.map((set) => ({
        ...set,
        exercise: { ...set.exercise, nameFr: null },
      })),
    }));
    exercises = response[1].map((exercise) => ({ ...exercise, nameFr: null }));
  }

  const now = new Date();
  const startOfWeek = new Date(now);
  const day = startOfWeek.getDay();
  const diffToMonday = day === 0 ? 6 : day - 1;
  startOfWeek.setDate(startOfWeek.getDate() - diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  const sessionsWithVolume = sessions.map((session) => {
    const volume = session.sets.reduce((acc, set) => acc + (set.actualReps ?? 0) * (set.actualWeightKg ?? 0), 0);
    const exerciseCount = new Set(session.sets.map((set) => set.exerciseId)).size;
    const setCount = session.sets.length;
    return { ...session, volume, exerciseCount, setCount };
  });

  const weeklySessions = sessionsWithVolume.filter((session) => (session.startedAt ?? session.createdAt) >= startOfWeek);
  const weeklyVolume = weeklySessions.reduce((acc, item) => acc + item.volume, 0);

  const allSets = sessions.flatMap((session) => session.sets);
  const exerciseUsage = new Map<string, { count: number; name: string }>();
  for (const set of allSets) {
    const current = exerciseUsage.get(set.exerciseId) ?? {
      count: 0,
      name: set.exercise.nameFr || set.exercise.name,
    };
    current.count += 1;
    exerciseUsage.set(set.exerciseId, current);
  }

  const mostWorked = [...exerciseUsage.entries()]
    .sort((a, b) => b[1].count - a[1].count)[0];

  const selected = exerciseId || exercises[0]?.id || "";
  const selectedExercise = exercises.find((item) => item.id === selected) ?? null;
  const selectedSets = allSets.filter((set) => set.exerciseId === selected);

  const bestWeight = selectedSets.reduce((acc, set) => Math.max(acc, set.actualWeightKg ?? 0), 0);
  const bestReps = selectedSets.reduce((acc, set) => Math.max(acc, set.actualReps ?? 0), 0);
  const selectedVolume = selectedSets.reduce((acc, set) => acc + (set.actualReps ?? 0) * (set.actualWeightKg ?? 0), 0);

  const selectedSessions = sessionsWithVolume
    .filter((session) => session.sets.some((set) => set.exerciseId === selected))
    .map((session) => {
      const sessionSets = session.sets.filter((set) => set.exerciseId === selected);
      const sessionVolume = sessionSets.reduce((acc, set) => acc + (set.actualReps ?? 0) * (set.actualWeightKg ?? 0), 0);
      return {
        sessionId: session.id,
        date: session.startedAt ?? session.createdAt,
        volume: sessionVolume,
      };
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  const latestVolume = selectedSessions[0]?.volume ?? 0;
  const previousVolume = selectedSessions[1]?.volume ?? 0;
  const evolution =
    latestVolume > previousVolume ? "en hausse" :
    latestVolume < previousVolume ? "en baisse" :
    "stable";

  const globalBestWeightSet = allSets
    .filter((set) => (set.actualWeightKg ?? 0) > 0)
    .sort((a, b) => (b.actualWeightKg ?? 0) - (a.actualWeightKg ?? 0))[0] ?? null;

  const bestVolumeByExercise = [...exerciseUsage.keys()]
    .map((id) => {
      const sets = allSets.filter((set) => set.exerciseId === id);
      const volume = sets.reduce((acc, set) => acc + (set.actualReps ?? 0) * (set.actualWeightKg ?? 0), 0);
      const name = sets[0]?.exercise.nameFr || sets[0]?.exercise.name || "Exercice";
      return { exerciseId: id, name, volume };
    })
    .sort((a, b) => b.volume - a.volume)[0] ?? null;

  const bestSession = sessionsWithVolume
    .filter((session) => session.status === "COMPLETED")
    .sort((a, b) => b.volume - a.volume)[0] ?? null;

  const totalDuration = sessionsWithVolume.reduce((acc, session) => acc + (session.durationSeconds ?? 0), 0);
  const averageDuration = sessionsWithVolume.length ? Math.round(totalDuration / sessionsWithVolume.length) : 0;
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const volumeByExerciseLast7Days = new Map<string, { name: string; volume: number }>();
  for (const session of sessions) {
    const sessionDate = session.startedAt ?? session.createdAt;
    if (sessionDate < sevenDaysAgo) continue;
    for (const set of session.sets) {
      const volume = (set.actualReps ?? 0) * (set.actualWeightKg ?? 0);
      if (volume <= 0) continue;
      const current = volumeByExerciseLast7Days.get(set.exerciseId) ?? {
        name: set.exercise.nameFr || set.exercise.name,
        volume: 0,
      };
      current.volume += volume;
      volumeByExerciseLast7Days.set(set.exerciseId, current);
    }
  }
  const donutExerciseDistribution = [...volumeByExerciseLast7Days.entries()]
    .map(([exerciseId, item]) => ({
      exerciseId,
      name: item.name,
      volume: item.volume,
    }))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 5);

  return {
    exerciseOptions: exercises.map((item) => ({
      id: item.id,
      name: item.nameFr || item.name,
    })),
    selectedExercise: selectedExercise ? { id: selectedExercise.id, name: selectedExercise.nameFr || selectedExercise.name } : null,
    headline: {
      weeklySessions: weeklySessions.length,
      weeklyVolume,
      totalSets: allSets.length,
      averageDuration,
      mostWorkedExercise: mostWorked ? mostWorked[1].name : "N/A",
    },
    progression: {
      bestWeight,
      bestReps,
      totalVolume: selectedVolume,
      lastSessionAt: selectedSessions[0]?.date ?? null,
      evolution,
    },
    records: {
      bestWeight: globalBestWeightSet
        ? { value: globalBestWeightSet.actualWeightKg ?? 0, exerciseName: globalBestWeightSet.exercise.nameFr || globalBestWeightSet.exercise.name }
        : null,
      bestExerciseVolume: bestVolumeByExercise,
      bestSession: bestSession
        ? { sessionId: bestSession.id, title: bestSession.title, volume: bestSession.volume }
        : null,
    },
    recentSessions: sessionsWithVolume.slice(0, 12).map((session) => ({
      id: session.id,
      date: session.startedAt ?? session.createdAt,
      status: session.status,
      setCount: session.setCount,
      volume: session.volume,
    })),
    donutExerciseDistribution,
    progressMetricReady: true,
  };
}
