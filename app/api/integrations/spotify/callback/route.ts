import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { absoluteUrl } from "@/src/lib/site-url";
import { encryptIntegrationSecret } from "@/src/lib/integration-crypto";
import { prisma } from "@/src/lib/prisma";
import { getSpotifyMe, exchangeSpotifyCode } from "@/src/server/spotify";
import { getAuthenticatedUserProfile } from "@/src/server/fitness-queries";

const STATE_COOKIE = "fitai_spotify_oauth_state";

function settingsRedirect(path: string) {
  return NextResponse.redirect(absoluteUrl(path));
}

export async function GET(request: Request) {
  const session = await auth().catch(() => null);

  if (!session?.user?.email) {
    return settingsRedirect("/login?callbackUrl=/settings");
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(STATE_COOKIE)?.value;
  cookieStore.delete(STATE_COOKIE);

  if (error) {
    return settingsRedirect("/settings?integrationError=spotify-denied");
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    return settingsRedirect("/settings?integrationError=spotify-state");
  }

  try {
    const profile = await getAuthenticatedUserProfile();
    const token = await exchangeSpotifyCode(code);
    const spotifyProfile = await getSpotifyMe(token.access_token);
    const expiresAt = new Date(Date.now() + Math.max(60, token.expires_in) * 1000);

    await prisma.integrationConnection.upsert({
      where: { userProfileId_provider: { userProfileId: profile.id, provider: "SPOTIFY" } },
      update: {
        status: "CONNECTED",
        externalAccountId: spotifyProfile.id,
        displayName: spotifyProfile.display_name || spotifyProfile.email || "Spotify",
        scopes: token.scope.split(" ").filter(Boolean),
        accessToken: encryptIntegrationSecret(token.access_token),
        refreshToken: encryptIntegrationSecret(token.refresh_token),
        tokenExpiresAt: expiresAt,
        connectedAt: new Date(),
        disconnectedAt: null,
        metadata: {
          product: spotifyProfile.product ?? null,
          email: spotifyProfile.email ?? null,
        },
      },
      create: {
        userProfileId: profile.id,
        provider: "SPOTIFY",
        status: "CONNECTED",
        externalAccountId: spotifyProfile.id,
        displayName: spotifyProfile.display_name || spotifyProfile.email || "Spotify",
        scopes: token.scope.split(" ").filter(Boolean),
        accessToken: encryptIntegrationSecret(token.access_token),
        refreshToken: encryptIntegrationSecret(token.refresh_token),
        tokenExpiresAt: expiresAt,
        connectedAt: new Date(),
        metadata: {
          product: spotifyProfile.product ?? null,
          email: spotifyProfile.email ?? null,
        },
      },
    });

    return settingsRedirect("/settings?integration=spotify-connected");
  } catch {
    return settingsRedirect("/settings?integrationError=spotify-callback");
  }
}
