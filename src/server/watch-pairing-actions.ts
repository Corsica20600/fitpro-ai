"use server";

import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { prisma } from "@/src/lib/prisma";
import { hashWatchDeviceToken } from "@/src/lib/watch-device-token";
import { requirePremiumAccess } from "@/src/server/premium-access";

function createWatchDeviceToken() {
  return `trkw_${randomBytes(32).toString("base64url")}`;
}

function cleanDeviceLabel(value: FormDataEntryValue | null) {
  const label = String(value ?? "").trim();
  return label.slice(0, 40) || "Montre Wear OS";
}

export async function createWatchDeviceTokenAction(formData: FormData) {
  const profile = await requirePremiumAccess();
  const token = createWatchDeviceToken();
  const label = cleanDeviceLabel(formData.get("label"));

  await prisma.watchDevice.create({
    data: {
      userProfileId: profile.id,
      label,
      tokenHash: hashWatchDeviceToken(token),
    },
  });

  redirect(`/settings?watchToken=${encodeURIComponent(token)}&watchLabel=${encodeURIComponent(label)}`);
}

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
