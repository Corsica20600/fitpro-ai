import { prisma } from "@/src/lib/prisma";
import { getOrCreateDemoProfile } from "@/src/server/fitness-queries";

export const AI_PROGRAM_GENERATION_MONTHLY_LIMIT = 4;

function getCurrentPeriodKey(now = new Date()) {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

export type AiGenerationLimitResult =
  | {
      ok: true;
      usageId: string;
      limit: number;
      used: number;
      remaining: number;
      periodKey: string;
    }
  | {
      ok: false;
      error: "ai_generation_limit_reached";
      limit: number;
      used: number;
      remaining: number;
      periodKey: string;
    };

export async function reserveAiProgramGeneration(input: {
  goal: string;
  level: string;
}): Promise<AiGenerationLimitResult> {
  const profile = await getOrCreateDemoProfile();
  const periodKey = getCurrentPeriodKey();

  return prisma.$transaction(async (tx) => {
    const used = await tx.aiProgramGeneration.count({
      where: {
        userProfileId: profile.id,
        periodKey,
        status: { in: ["RESERVED", "SUCCESS"] },
      },
    });

    if (used >= AI_PROGRAM_GENERATION_MONTHLY_LIMIT) {
      return {
        ok: false as const,
        error: "ai_generation_limit_reached" as const,
        limit: AI_PROGRAM_GENERATION_MONTHLY_LIMIT,
        used,
        remaining: 0,
        periodKey,
      };
    }

    const usage = await tx.aiProgramGeneration.create({
      data: {
        userProfileId: profile.id,
        periodKey,
        goal: input.goal,
        level: input.level,
        status: "RESERVED",
      },
      select: { id: true },
    });

    return {
      ok: true as const,
      usageId: usage.id,
      limit: AI_PROGRAM_GENERATION_MONTHLY_LIMIT,
      used: used + 1,
      remaining: Math.max(0, AI_PROGRAM_GENERATION_MONTHLY_LIMIT - used - 1),
      periodKey,
    };
  });
}

export async function completeAiProgramGeneration(usageId: string, ok: boolean) {
  await prisma.aiProgramGeneration.update({
    where: { id: usageId },
    data: { status: ok ? "SUCCESS" : "FAILED" },
  });
}
