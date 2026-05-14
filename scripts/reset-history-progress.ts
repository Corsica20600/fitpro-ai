import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DEMO_EMAIL = "demo@fitai.local";

async function main() {
  const profile = await prisma.userProfile.findUnique({
    where: { email: DEMO_EMAIL },
    select: { id: true, email: true, displayName: true },
  });

  if (!profile) {
    console.log(JSON.stringify({ ok: true, message: "No demo profile found, nothing to reset." }, null, 2));
    return;
  }

  const sessionIds = await prisma.workoutSession.findMany({
    where: { userProfileId: profile.id },
    select: { id: true },
  });
  const ids = sessionIds.map((item) => item.id);

  const deletedWatch = ids.length
    ? await prisma.watchSession.deleteMany({ where: { workoutSessionId: { in: ids } } })
    : { count: 0 };
  const deletedSets = ids.length
    ? await prisma.workoutSet.deleteMany({ where: { workoutSessionId: { in: ids } } })
    : { count: 0 };
  const deletedSessions = await prisma.workoutSession.deleteMany({
    where: { userProfileId: profile.id },
  });
  const deletedProgress = await prisma.progressMetric.deleteMany({
    where: { userProfileId: profile.id },
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        profile: {
          id: profile.id,
          email: profile.email,
          displayName: profile.displayName,
        },
        deleted: {
          watchSessions: deletedWatch.count,
          workoutSets: deletedSets.count,
          workoutSessions: deletedSessions.count,
          progressMetrics: deletedProgress.count,
        },
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
