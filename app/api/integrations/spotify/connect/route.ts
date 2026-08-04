import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { absoluteUrl } from "@/src/lib/site-url";
import { getSpotifyAuthorizeUrl, isSpotifyConfigured } from "@/src/server/spotify";
import { requirePremiumApiAccess } from "@/src/server/premium-access";

const STATE_COOKIE = "traknio_spotify_oauth_state";

export async function GET() {
  const session = await auth().catch(() => null);

  if (!session?.user?.email) {
    return NextResponse.redirect(absoluteUrl("/login?callbackUrl=/settings"));
  }

  const access = await requirePremiumApiAccess();
  if (!access.ok) return NextResponse.redirect(absoluteUrl("/settings?access=premium"));

  if (!isSpotifyConfigured()) {
    return NextResponse.redirect(absoluteUrl("/settings?integrationError=spotify-config"));
  }

  const state = randomBytes(24).toString("base64url");
  const cookieStore = await cookies();
  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 10 * 60,
    path: "/",
  });

  return NextResponse.redirect(getSpotifyAuthorizeUrl(state));
}
