import { prisma } from "@/src/lib/prisma";

export async function syncProgramExerciseTargets(input: {
  workoutSessionId: string;
  exerciseId: string;
  programExerciseId?: string | null;
  actualReps?: number | null;
  actualWeightKg?: number | null;
}) {
  if (!input.workoutSessionId || !input.exerciseId) return null;

  const session = await prisma.workoutSession.findUnique({
    where: { id: input.workoutSessionId },
    select: { programId: true },
  });
  if (!session?.programId) return null;

  const programExercise = input.programExerciseId
    ? await prisma.programExercise.findFirst({
        where: {
          id: input.programExerciseId,
          exerciseId: input.exerciseId,
          programDay: { programId: session.programId },
        },
        select: { id: true },
      })
    : await prisma.programExercise.findFirst({
        where: {
          exerciseId: input.exerciseId,
          programDay: { programId: session.programId },
        },
        orderBy: [{ programDay: { dayIndex: "asc" } }, { orderIndex: "asc" }],
        select: { id: true },
      });

  if (!programExercise) return null;

  const actualReps = Number.isFinite(input.actualReps as number) && (input.actualReps as number) > 0
    ? Math.floor(input.actualReps as number)
    : null;
  const actualWeightKg = Number.isFinite(input.actualWeightKg as number) && (input.actualWeightKg as number) > 0
    ? input.actualWeightKg as number
    : null;

  await prisma.programExercise.update({
    where: { id: programExercise.id },
    data: {
      ...(actualReps ? { repsMin: actualReps, repsMax: actualReps } : {}),
      repsText: actualWeightKg ? `${actualWeightKg} kg` : null,
    },
  });

  return programExercise.id;
}
