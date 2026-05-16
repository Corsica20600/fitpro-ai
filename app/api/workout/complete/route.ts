import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/src/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  const sessionId = String(body.sessionId ?? "").trim();

  if (!sessionId) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const session = await prisma.workoutSession.findUnique({ where: { id: sessionId } });
  if (!session) {
    return NextResponse.json({ error: "session_not_found" }, { status: 404 });
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

  const sets = await prisma.workoutSet.findMany({
    where: { workoutSessionId: sessionId },
    select: { exerciseId: true, actualReps: true, actualWeightKg: true },
  });

  const exercisesCount = new Set(sets.map((set) => set.exerciseId)).size;
  const setsCount = sets.length;
  const volumeTotal = sets.reduce((acc, set) => acc + ((set.actualReps ?? 0) * (set.actualWeightKg ?? 0)), 0);

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
