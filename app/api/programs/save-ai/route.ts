import { NextResponse } from "next/server";
import { saveGeneratedProgram } from "@/src/server/ai-program-generator";

export async function POST(request: Request) {
  const body = await request.json();
  const program = body?.program;

  if (!program || typeof program !== "object") {
    return NextResponse.json({ ok: false, error: "invalid_program_payload" }, { status: 400 });
  }

  const result = await saveGeneratedProgram(program);
  if (!result.ok) return NextResponse.json(result, { status: 422 });
  return NextResponse.json(result);
}

