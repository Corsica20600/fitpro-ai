import { NextResponse } from "next/server";
import { generateAiProgram } from "@/src/server/ai-program-generator";

export async function POST(request: Request) {
  const body = await request.json();

  const goal = String(body.goal ?? "").trim();
  const level = String(body.level ?? "").trim();
  const sessionDurationMin = Number(body.sessionDurationMin ?? 60);
  const availableEquipment = Array.isArray(body.availableEquipment) ? body.availableEquipment.map(String) : [];
  const priorityMuscles = Array.isArray(body.priorityMuscles) ? body.priorityMuscles.map(String) : [];
  const restrictions = String(body.restrictions ?? "").trim();

  if (!["MUSCLE_GAIN", "FAT_LOSS", "STRENGTH", "RECOMPOSITION"].includes(goal)) {
    return NextResponse.json({ ok: false, error: "invalid_goal" }, { status: 400 });
  }
  if (!["BEGINNER", "INTERMEDIATE", "ADVANCED"].includes(level)) {
    return NextResponse.json({ ok: false, error: "invalid_level" }, { status: 400 });
  }

  const result = await generateAiProgram({
    goal: goal as "MUSCLE_GAIN" | "FAT_LOSS" | "STRENGTH" | "RECOMPOSITION",
    level: level as "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
    daysPerWeek: 1,
    sessionDurationMin: Number.isFinite(sessionDurationMin) ? Math.max(25, Math.min(120, Math.floor(sessionDurationMin))) : 60,
    availableEquipment,
    priorityMuscles,
    restrictions,
  });

  if (!result.ok) {
    return NextResponse.json(result, { status: 422 });
  }

  return NextResponse.json(result);
}
