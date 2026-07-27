"use server";

import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { getStripe } from "@/src/lib/stripe";
import { prisma } from "@/src/lib/prisma";

function normalizeEmail(email?: string | null) {
  const normalized = email?.trim().toLowerCase();
  return normalized && normalized.includes("@") ? normalized : null;
}

export async function deleteAccountAction(formData: FormData) {
  const session = await auth().catch(() => null);
  const activeEmail = normalizeEmail(session?.user?.email);

  if (!activeEmail) {
    redirect("/login");
  }

  const confirmEmail = normalizeEmail(String(formData.get("confirmEmail") ?? ""));
  const confirmText = String(formData.get("confirmText") ?? "").trim();
  const understood = formData.get("understood") === "on";

  if (confirmEmail !== activeEmail || confirmText !== "SUPPRIMER" || !understood) {
    redirect("/settings?deleteError=confirmation");
  }

  const profile = await prisma.userProfile.findUnique({
    where: { email: activeEmail },
    select: { id: true, stripeSubscriptionId: true },
  });

  if (!profile) {
    await signOut({ redirectTo: "/data-deletion?accountDeleted=1" });
    return;
  }

  if (profile.stripeSubscriptionId) {
    try {
      await getStripe().subscriptions.cancel(profile.stripeSubscriptionId);
    } catch {
      redirect("/settings?deleteError=billing");
    }
  }

  await prisma.$transaction(async (tx) => {
    const sessions = await tx.workoutSession.findMany({
      where: { userProfileId: profile.id },
      select: { id: true },
    });
    const sessionIds = sessions.map((session) => session.id);

    const programs = await tx.program.findMany({
      where: { userProfileId: profile.id },
      select: { id: true },
    });
    const programIds = programs.map((program) => program.id);

    if (sessionIds.length > 0) {
      await tx.watchSession.deleteMany({ where: { workoutSessionId: { in: sessionIds } } });
      await tx.workoutSet.deleteMany({ where: { workoutSessionId: { in: sessionIds } } });
      await tx.workoutSession.deleteMany({ where: { id: { in: sessionIds } } });
    }

    if (programIds.length > 0) {
      const days = await tx.programDay.findMany({
        where: { programId: { in: programIds } },
        select: { id: true },
      });
      const dayIds = days.map((day) => day.id);

      if (dayIds.length > 0) {
        await tx.programExercise.deleteMany({ where: { programDayId: { in: dayIds } } });
        await tx.programDay.deleteMany({ where: { id: { in: dayIds } } });
      }

      await tx.program.deleteMany({ where: { id: { in: programIds } } });
    }

    await tx.watchDevice.deleteMany({ where: { userProfileId: profile.id } });
    await tx.integrationConnection.deleteMany({ where: { userProfileId: profile.id } });
    await tx.progressMetric.deleteMany({ where: { userProfileId: profile.id } });
    await tx.userProfile.delete({ where: { id: profile.id } });
  });

  await signOut({ redirectTo: "/data-deletion?accountDeleted=1" });
}
