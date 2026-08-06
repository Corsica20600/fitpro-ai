import { NextResponse } from "next/server";
import { getAuthenticatedUserProfile } from "@/src/server/fitness-queries";
import { createTemporaryWatchPairingToken } from "@/src/server/watch-pairing";

export async function POST(request: Request) {
  const profile = await getAuthenticatedUserProfile().catch(() => null);
  if (!profile) {
    return NextResponse.json({ ok: false, error: "auth_required" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const result = await createTemporaryWatchPairingToken(profile, body.label);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json(
    {
      ok: true,
      pairingToken: result.pairingToken,
      expiresAt: result.expiresAt.toISOString(),
      accountPairingId: result.accountPairingId,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
