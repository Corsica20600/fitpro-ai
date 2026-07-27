import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/src/lib/prisma";
import { hashWatchDeviceToken } from "@/src/lib/watch-device-token";

type WatchAccessResult =
  | { ok: true; mode: "session" | "device" | "token" | "legacy"; userProfileId?: string; profileEmail?: string | null }
  | { ok: false; response: NextResponse };

function getExpectedWatchToken() {
  return process.env.FITAI_WATCH_TOKEN?.trim() || "";
}

function safeTokenEquals(actual: string, expected: string) {
  return actual.length > 0 && expected.length > 0 && actual === expected;
}

export async function requireWatchAccess(request: Request): Promise<WatchAccessResult> {
  const session = await auth().catch(() => null);
  if (session?.user?.email) {
    const email = session.user.email.trim().toLowerCase();
    const profile = await prisma.userProfile.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    if (profile) {
      return { ok: true, mode: "session", userProfileId: profile.id, profileEmail: profile.email };
    }

    return { ok: true, mode: "session", profileEmail: email };
  }

  const deviceToken = request.headers.get("x-watch-device-token")?.trim() || "";
  if (deviceToken) {
    const device = await prisma.watchDevice.findUnique({
      where: { tokenHash: hashWatchDeviceToken(deviceToken) },
      select: {
        id: true,
        revokedAt: true,
        userProfileId: true,
        userProfile: { select: { email: true } },
      },
    });

    if (device && !device.revokedAt) {
      await prisma.watchDevice.update({
        where: { id: device.id },
        data: { lastSeenAt: new Date() },
      });

      return {
        ok: true,
        mode: "device",
        userProfileId: device.userProfileId,
        profileEmail: device.userProfile.email,
      };
    }
  }

  const expectedToken = getExpectedWatchToken();
  if (!expectedToken) {
    // Compatibility mode: the current installed watch app has no token yet.
    return { ok: true, mode: "legacy" };
  }

  const providedToken = request.headers.get("x-watch-token")?.trim() || "";
  if (safeTokenEquals(providedToken, expectedToken)) {
    return { ok: true, mode: "token" };
  }

  return {
    ok: false,
    response: NextResponse.json(
      { error: "watch_pairing_required" },
      { status: 401 },
    ),
  };
}
