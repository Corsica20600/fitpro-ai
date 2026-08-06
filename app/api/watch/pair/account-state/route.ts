import { NextResponse } from "next/server";
import { getAuthenticatedUserProfile } from "@/src/server/fitness-queries";
import { createAccountPairingId } from "@/src/server/watch-pairing";

export async function GET() {
  const profile = await getAuthenticatedUserProfile().catch(() => null);
  if (!profile) {
    return NextResponse.json({ ok: false, error: "auth_required" }, { status: 401 });
  }

  return NextResponse.json(
    {
      ok: true,
      accountPairingId: createAccountPairingId(profile),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
