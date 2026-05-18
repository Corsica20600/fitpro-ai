import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getOrCreateDemoProfile } from "@/src/server/fitness-queries";

type ReorderPayload = {
  exerciseId?: string;
  direction?: "up" | "down";
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ programId: string }> },
) {
  const profile = await getOrCreateDemoProfile();
  const { programId } = await context.params;
  const cleanProgramId = String(programId ?? "").trim();
  if (!cleanProgramId) {
    return NextResponse.json({ ok: false, error: "missing_program_id" }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as ReorderPayload;
  const exerciseId = String(body.exerciseId ?? "").trim();
  const direction = String(body.direction ?? "").trim();
  if (!exerciseId || !["up", "down"].includes(direction)) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const current = await prisma.programExercise.findFirst({
    where: {
      id: exerciseId,
      programDay: { programId: cleanProgramId, program: { userProfileId: profile.id } },
    },
    select: { id: true, programDayId: true, orderIndex: true },
  });
  if (!current) {
    return NextResponse.json({ ok: false, error: "exercise_not_found" }, { status: 404 });
  }

  const sibling = await prisma.programExercise.findFirst({
    where: {
      programDayId: current.programDayId,
      orderIndex: direction === "up" ? current.orderIndex - 1 : current.orderIndex + 1,
    },
    select: { id: true, orderIndex: true },
  });
  if (!sibling) {
    const unchanged = await prisma.programExercise.findMany({
      where: { programDayId: current.programDayId },
      orderBy: { orderIndex: "asc" },
      select: { id: true, orderIndex: true },
    });
    return NextResponse.json({ ok: true, updated: unchanged });
  }

  await prisma.$transaction([
    prisma.programExercise.update({
      where: { id: current.id },
      data: { orderIndex: sibling.orderIndex },
    }),
    prisma.programExercise.update({
      where: { id: sibling.id },
      data: { orderIndex: current.orderIndex },
    }),
  ]);

  const updated = await prisma.programExercise.findMany({
    where: { programDayId: current.programDayId },
    orderBy: { orderIndex: "asc" },
    select: { id: true, orderIndex: true },
  });

  return NextResponse.json({ ok: true, updated });
}

