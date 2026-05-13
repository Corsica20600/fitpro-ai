"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/src/lib/prisma";
import { getOrCreateDemoProfile } from "@/src/server/fitness-queries";

export async function createSimpleProgramAction(formData: FormData) {
  const profile = await getOrCreateDemoProfile();
  const name = String(formData.get("name") ?? "Programme MVP").trim();
  const goal = String(formData.get("goal") ?? "HYPERTROPHY");
  const level = String(formData.get("level") ?? "INTERMEDIATE");
  const sessionsPerWeek = Number(formData.get("sessionsPerWeek") ?? 4);

  await prisma.program.create({
    data: {
      userProfileId: profile.id,
      name: name.length ? name : "Programme MVP",
      goal: goal as never,
      level: level as never,
      sessionsPerWeek: Number.isFinite(sessionsPerWeek) ? Math.max(2, Math.min(6, sessionsPerWeek)) : 4,
      status: "DRAFT",
      days: {
        create: [
          { dayIndex: 1, title: "Jour 1 - Push", focus: "Pectoraux / Epaules / Triceps" },
          { dayIndex: 2, title: "Jour 2 - Pull", focus: "Dos / Biceps" },
          { dayIndex: 3, title: "Jour 3 - Legs", focus: "Jambes / Core" },
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
