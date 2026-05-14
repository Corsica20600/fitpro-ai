import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

function getDatabaseHostFromUrl(rawUrl?: string): string | null {
  if (!rawUrl) return null;
  try {
    return new URL(rawUrl).hostname;
  } catch {
    return null;
  }
}

export async function GET() {
  const databaseHost = getDatabaseHostFromUrl(process.env.DATABASE_URL);

  try {
    const [total, active, inactive, latest] = await Promise.all([
      prisma.exercise.count(),
      prisma.exercise.count({ where: { isActive: true } }),
      prisma.exercise.count({ where: { isActive: false } }),
      prisma.exercise.findFirst({
        select: { slug: true, updatedAt: true, isActive: true },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      env: process.env.VERCEL_ENV ?? "unknown",
      databaseHost,
      counts: { total, active, inactive },
      latest,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        ok: false,
        env: process.env.VERCEL_ENV ?? "unknown",
        databaseHost,
        error: message,
        checkedAt: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
