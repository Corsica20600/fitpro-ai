import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { hashDeviceToken } from "@/src/lib/device-token";

type HealthAccessResult =
  | { ok: true; mode: "device"; userProfileId: string }
  | { ok: false; response: NextResponse };

export async function requireHealthSyncAccess(
  request: Request,
  provider: "health_connect" | "samsung_health",
): Promise<HealthAccessResult> {
  void provider;

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

  return {
    ok: false,
    response: NextResponse.json({ ok: false, error: "health_device_pairing_required" }, { status: 401 }),
  };
}
