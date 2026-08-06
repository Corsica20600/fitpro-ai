"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/src/lib/prisma";
import { requirePremiumAccess } from "@/src/server/premium-access";

export async function revokeWatchDeviceAction(formData: FormData) {
  const profile = await requirePremiumAccess();
  const deviceId = String(formData.get("deviceId") ?? "").trim();

  if (!deviceId) {
    redirect("/settings?watchError=device");
  }

  await prisma.watchDevice.updateMany({
    where: { id: deviceId, userProfileId: profile.id },
    data: { revokedAt: new Date() },
  });

  redirect("/settings?watch=revoked");
}
