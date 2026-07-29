import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { hashDeviceToken } from "@/src/lib/device-token";

type HealthAccessResult =
  | { ok: true; mode: "device" | "legacy"; userProfileId?: string }
  | { ok: false; response: NextResponse };

function expectedLegacyToken(provider: "health_connect" | "samsung_health") {
  if (provider === "health_connect") {
    return process.env.HEALTH_CONNECT_SYNC_TOKEN?.trim() || process.env.SAMSUNG_SYNC_TOKEN?.trim() || "";
  }

  return process.env.SAMSUNG_SYNC_TOKEN?.trim() || "";
}

function safeTokenEquals(actual: string, expected: string) {
  return actual.length > 0 && expected.length > 0 && actual === expected;
}

export async function requireHealthSyncAccess(
  request: Request,
  provider: "health_connect" | "samsung_health",
): Promise<HealthAccessResult> {
  const deviceToken = request.headers.get("x-health-device-token")?.trim() || "";
  if (deviceToken) {
    const device = await prisma.healthDevice.findUnique({
      where: { tokenHash: hashDeviceToken(deviceToken) },
      select: {
        id: true,
        lastSeenAt: true,
        revokedAt: true,
        userProfileId: true,
      },
    });

    if (device && !device.revokedAt) {
      const now = Date.now();
      const lastSeenAtMs = device.lastSeenAt?.getTime() ?? 0;
      if (now - lastSeenAtMs > 60_000) {
        await prisma.healthDevice.update({
          where: { id: device.id },
          data: { lastSeenAt: new Date(now) },
        });
      }

      return { ok: true, mode: "device", userProfileId: device.userProfileId };
    }
  }

  const legacyToken = request.headers.get("x-sync-token")?.trim() || "";
  if (safeTokenEquals(legacyToken, expectedLegacyToken(provider))) {
    return { ok: true, mode: "legacy" };
  }

  return {
    ok: false,
    response: NextResponse.json({ ok: false, error: "health_device_pairing_required" }, { status: 401 }),
  };
}
