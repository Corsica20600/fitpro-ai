import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { absoluteUrl } from "@/src/lib/site-url";
import { getSpotifyAuthorizeUrl, isSpotifyConfigured } from "@/src/server/spotify";

const STATE_COOKIE = "traknio_spotify_oauth_state";

export async function GET() {
  const session = await auth().catch(() => null);

  if (!session?.user?.email) {
    return NextResponse.redirect(absoluteUrl("/login?callbackUrl=/settings"));
  }

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
