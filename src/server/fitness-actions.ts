"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/src/lib/prisma";
import { getOrCreateDemoProfile } from "@/src/server/fitness-queries";

export async function createSimpleProgramAction(formData: FormData) {
  const profile = await getOrCreateDemoProfile();
  const name = String(formData.get("name") ?? "Programme MVP").trim();
  const goal = String(formData.get("goal") ?? "HYPERTROPHY");
  const level = String(formData.get("level") ?? "INTERMEDIATE");

  await prisma.program.create({
    data: {
      userProfileId: profile.id,
      name: name.length ? name : "Programme MVP",
      goal: goal as never,
      level: level as never,
      sessionsPerWeek: 1,
      status: "DRAFT",
      days: {
        create: [
          { dayIndex: 1, title: "Jour 1", focus: "A personnaliser" },
        ],
      },
    },
  });

  revalidatePath("/programs");
}

export async function startWorkoutSessionAction(formData: FormData) {
  const profile = await getOrCreateDemoProfile();
  const programIdRaw = String(formData.get("programId") ?? "").trim();
  const title = String(formData.get("title") ?? "Seance libre").trim();

  const session = await prisma.workoutSession.create({
    data: {
      userProfileId: profile.id,
      programId: programIdRaw.length ? programIdRaw : null,
      title: title.length ? title : "Seance libre",
      status: "IN_PROGRESS",
      startedAt: new Date(),
    },
  });

  await prisma.watchSession.create({
    data: {
      workoutSessionId: session.id,
      currentExerciseIndex: 0,
      currentSetIndex: 1,
      status: "ACTIVE",
      lastSyncAt: new Date(),
    },
  });

  revalidatePath("/workout");
  revalidatePath("/history");
}

export async function logWorkoutSetAction(formData: FormData) {
  const sessionId = String(formData.get("sessionId") ?? "").trim();
  const exerciseId = String(formData.get("exerciseId") ?? "").trim();
  const reps = Number(formData.get("actualReps") ?? 0);
  const weight = Number(formData.get("actualWeightKg") ?? 0);

  if (!sessionId || !exerciseId) return;

  const countForExercise = await prisma.workoutSet.count({
    where: { workoutSessionId: sessionId, exerciseId },
  });

  await prisma.workoutSet.create({
    data: {
      workoutSessionId: sessionId,
      exerciseId,
      setIndex: countForExercise + 1,
      actualReps: Number.isFinite(reps) && reps > 0 ? reps : null,
      actualWeightKg: Number.isFinite(weight) && weight > 0 ? weight : null,
      isCompleted: true,
      completedAt: new Date(),
      restSeconds: 90,
    },
  });

  revalidatePath("/workout");
  revalidatePath("/history");
}

export async function completeWorkoutSessionAction(formData: FormData) {
  const sessionId = String(formData.get("sessionId") ?? "").trim();
  if (!sessionId) return;

  const started = await prisma.workoutSession.findUnique({ where: { id: sessionId } });
  const endedAt = new Date();

  await prisma.workoutSession.update({
    where: { id: sessionId },
    data: {
      status: "COMPLETED",
      endedAt,
      durationSeconds: started?.startedAt ? Math.max(60, Math.floor((endedAt.getTime() - started.startedAt.getTime()) / 1000)) : null,
    },
  });

  await prisma.watchSession.updateMany({
    where: { workoutSessionId: sessionId },
    data: {
      status: "COMPLETED",
      lastSyncAt: new Date(),
    },
  });

  revalidatePath("/workout");
  revalidatePath("/history");
}

export async function addExerciseToProgramDayAction(formData: FormData) {
  const profile = await getOrCreateDemoProfile();
  const programId = String(formData.get("programId") ?? "").trim();
  const dayId = String(formData.get("dayId") ?? "").trim();
  const exerciseId = String(formData.get("exerciseId") ?? "").trim();
  const sets = Number(formData.get("sets") ?? 4);
  const repsMin = Number(formData.get("repsMin") ?? 8);
  const repsMax = Number(formData.get("repsMax") ?? 12);
  const restSeconds = Number(formData.get("restSeconds") ?? 90);

  if (!programId || !dayId || !exerciseId) return;

  const day = await prisma.programDay.findFirst({
    where: {
      id: dayId,
      programId,
      program: { userProfileId: profile.id },
    },
    select: { id: true },
  });

  if (!day) return;

  const last = await prisma.programExercise.findFirst({
    where: { programDayId: dayId },
    orderBy: { orderIndex: "desc" },
    select: { orderIndex: true },
  });

  await prisma.programExercise.create({
    data: {
      programDayId: dayId,
      exerciseId,
      orderIndex: (last?.orderIndex ?? 0) + 1,
      sets: Number.isFinite(sets) ? Math.max(1, Math.min(12, sets)) : 4,
      repsMin: Number.isFinite(repsMin) ? Math.max(1, Math.min(40, repsMin)) : 8,
      repsMax: Number.isFinite(repsMax) ? Math.max(1, Math.min(60, repsMax)) : 12,
      restSeconds: Number.isFinite(restSeconds) ? Math.max(15, Math.min(300, restSeconds)) : 90,
    },
  });

  revalidatePath("/programs");
}

export async function addProgramDayAction(formData: FormData) {
  const profile = await getOrCreateDemoProfile();
  const programId = String(formData.get("programId") ?? "").trim();
  if (!programId) return;

  const program = await prisma.program.findFirst({
    where: { id: programId, userProfileId: profile.id },
    include: { days: { select: { dayIndex: true }, orderBy: { dayIndex: "desc" }, take: 1 } },
  });
  if (!program) return;

  const nextDayIndex = (program.days[0]?.dayIndex ?? 0) + 1;
  await prisma.programDay.create({
    data: {
      programId: program.id,
      dayIndex: nextDayIndex,
      title: `Jour ${nextDayIndex}`,
      focus: "A personnaliser",
    },
  });

  revalidatePath("/programs");
}

export async function renameProgramDayAction(formData: FormData) {
  const profile = await getOrCreateDemoProfile();
  const programId = String(formData.get("programId") ?? "").trim();
  const dayId = String(formData.get("dayId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const focus = String(formData.get("focus") ?? "").trim();
  if (!programId || !dayId) return;

  const day = await prisma.programDay.findFirst({
    where: { id: dayId, programId, program: { userProfileId: profile.id } },
    select: { dayIndex: true },
  });
  if (!day) return;

  await prisma.programDay.update({
    where: { id: dayId },
    data: {
      title: title || `Jour ${day.dayIndex}`,
      focus: focus || null,
    },
  });

  revalidatePath("/programs");
}

export async function deleteProgramDayAction(formData: FormData) {
  const profile = await getOrCreateDemoProfile();
  const programId = String(formData.get("programId") ?? "").trim();
  const dayId = String(formData.get("dayId") ?? "").trim();
  if (!programId || !dayId) return;

  const program = await prisma.program.findFirst({
    where: { id: programId, userProfileId: profile.id },
    include: { days: { select: { id: true, dayIndex: true }, orderBy: { dayIndex: "asc" } } },
  });
  if (!program || program.days.length <= 1) return;

  const dayExists = program.days.find((d) => d.id === dayId);
  if (!dayExists) return;

  await prisma.programDay.delete({ where: { id: dayId } });

  const remainingDays = await prisma.programDay.findMany({
    where: { programId: program.id },
    orderBy: { dayIndex: "asc" },
    select: { id: true },
  });

  await Promise.all(
    remainingDays.map((day, idx) =>
      prisma.programDay.update({
        where: { id: day.id },
        data: { dayIndex: idx + 1 },
      }),
    ),
  );

  revalidatePath("/programs");
}

export async function resetProgramStructureAction() {
  const profile = await getOrCreateDemoProfile();

  const programs = await prisma.program.findMany({
    where: { userProfileId: profile.id },
    include: { days: { select: { id: true } } },
  });

  for (const program of programs) {
    await prisma.programExercise.deleteMany({
      where: { programDay: { programId: program.id } },
    });
    await prisma.programDay.deleteMany({ where: { programId: program.id } });
    await prisma.programDay.create({
      data: {
        programId: program.id,
        dayIndex: 1,
        title: "Jour 1",
        focus: "A personnaliser",
      },
    });
    await prisma.program.update({
      where: { id: program.id },
      data: { sessionsPerWeek: 1 },
    });
  }

  revalidatePath("/programs");
}
