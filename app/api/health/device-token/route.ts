import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { hashDeviceToken } from "@/src/lib/device-token";
import { getAuthenticatedUserProfile } from "@/src/server/fitness-queries";

type TokenRequest = {
  label?: string;
};

function createHealthDeviceToken() {
  return `trkh_${randomBytes(32).toString("base64url")}`;
}

function cleanDeviceLabel(value: unknown) {
  const label = typeof value === "string" ? value.trim() : "";
  return label.slice(0, 40) || "Téléphone Android";
}

export async function POST(request: Request) {
  const profile = await getAuthenticatedUserProfile().catch((error: unknown) => {
    if (error instanceof Error && error.message === "AUTH_REQUIRED") return null;
    throw error;
  });

  if (!profile) {
    return NextResponse.json({ ok: false, error: "auth_required" }, { status: 401 });
  }

  let body: TokenRequest = {};
  try {
    body = (await request.json()) as TokenRequest;
  } catch {
    body = {};
  }

  const token = createHealthDeviceToken();
  const label = cleanDeviceLabel(body.label);

  await prisma.healthDevice.create({
    data: {
      userProfileId: profile.id,
      label,
      tokenHash: hashDeviceToken(token),
      lastSeenAt: new Date(),
    },
  });

  await prisma.integrationConnection.upsert({
    where: { userProfileId_provider: { userProfileId: profile.id, provider: "HEALTH_CONNECT" } },
    update: {
      status: "PENDING",
      displayName: "Health Connect",
      scopes: ["ExerciseSession", "HeartRate", "Sleep", "Steps", "TotalCaloriesBurned", "Distance"],
      disconnectedAt: null,
      metadata: {
        source: "android_device_token",
        deviceLabel: label,
      },
    },
    create: {
      userProfileId: profile.id,
      provider: "HEALTH_CONNECT",
      status: "PENDING",
      displayName: "Health Connect",
      scopes: ["ExerciseSession", "HeartRate", "Sleep", "Steps", "TotalCaloriesBurned", "Distance"],
      metadata: {
        source: "android_device_token",
        deviceLabel: label,
      },
    },
  });

  return NextResponse.json({ ok: true, token });
}
