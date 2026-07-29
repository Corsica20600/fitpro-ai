import { absoluteUrl } from "@/src/lib/site-url";
import { decryptIntegrationSecret, encryptIntegrationSecret } from "@/src/lib/integration-crypto";
import { prisma } from "@/src/lib/prisma";

export const SPOTIFY_SCOPES = [
  "user-read-private",
  "user-read-email",
  "user-read-playback-state",
  "user-read-currently-playing",
  "user-modify-playback-state",
] as const;

export function isSpotifyConfigured() {
  return Boolean(process.env.SPOTIFY_CLIENT_ID?.trim() && process.env.SPOTIFY_CLIENT_SECRET?.trim());
}

export function getSpotifyRedirectUri() {
  return process.env.SPOTIFY_REDIRECT_URI?.trim() || absoluteUrl("/api/integrations/spotify/callback");
}

export class SpotifyIntegrationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "SpotifyIntegrationError";
  }
}

export function getSpotifyAuthorizeUrl(state: string) {
  const clientId = process.env.SPOTIFY_CLIENT_ID?.trim();

  if (!clientId) {
    throw new Error("SPOTIFY_CLIENT_ID_MISSING");
  }

  const url = new URL("https://accounts.spotify.com/authorize");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("scope", SPOTIFY_SCOPES.join(" "));
  url.searchParams.set("redirect_uri", getSpotifyRedirectUri());
  url.searchParams.set("state", state);
  return url;
}

export async function exchangeSpotifyCode(code: string) {
  const clientId = process.env.SPOTIFY_CLIENT_ID?.trim();
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new SpotifyIntegrationError("spotify-config", "Spotify client credentials are missing.");
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "authorization": `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: getSpotifyRedirectUri(),
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    let details: { error?: string; error_description?: string } = {};
    try {
      details = (await response.json()) as { error?: string; error_description?: string };
    } catch {
      details = {};
    }

    if (details.error === "invalid_client") {
      throw new SpotifyIntegrationError("spotify-client", details.error_description || "Invalid Spotify client credentials.");
    }

    if (details.error === "invalid_grant") {
      throw new SpotifyIntegrationError("spotify-redirect", details.error_description || "Invalid Spotify redirect URI or expired code.");
    }

    throw new SpotifyIntegrationError("spotify-token", details.error_description || "Spotify token exchange failed.");
  }

  return response.json() as Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope: string;
    token_type: "Bearer";
  }>;
}

export async function refreshSpotifyAccessToken(refreshToken: string) {
  const clientId = process.env.SPOTIFY_CLIENT_ID?.trim();
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new SpotifyIntegrationError("spotify-config", "Spotify client credentials are missing.");
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "authorization": `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new SpotifyIntegrationError("spotify-token", "Spotify token refresh failed.");
  }

  return response.json() as Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope?: string;
    token_type: "Bearer";
  }>;
}

export async function getSpotifyMe(accessToken: string) {
  const response = await fetch("https://api.spotify.com/v1/me", {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new SpotifyIntegrationError("spotify-profile", "Spotify profile request failed.");
  }

  return response.json() as Promise<{
    id: string;
    display_name?: string | null;
    email?: string | null;
    product?: string | null;
  }>;
}

export async function getSpotifyAccessTokenForProfile(userProfileId: string) {
  const connection = await prisma.integrationConnection.findUnique({
    where: { userProfileId_provider: { userProfileId, provider: "SPOTIFY" } },
    select: {
      id: true,
      status: true,
      accessToken: true,
      refreshToken: true,
      tokenExpiresAt: true,
    },
  });

  if (!connection || connection.status !== "CONNECTED") return null;

  const accessToken = decryptIntegrationSecret(connection.accessToken);
  const refreshToken = decryptIntegrationSecret(connection.refreshToken);
  const expiresAtMs = connection.tokenExpiresAt?.getTime() ?? 0;

  if (accessToken && expiresAtMs > Date.now() + 60_000) return accessToken;
  if (!refreshToken) return accessToken;

  const refreshed = await refreshSpotifyAccessToken(refreshToken);
  await prisma.integrationConnection.update({
    where: { id: connection.id },
    data: {
      accessToken: encryptIntegrationSecret(refreshed.access_token),
      refreshToken: encryptIntegrationSecret(refreshed.refresh_token ?? refreshToken),
      tokenExpiresAt: new Date(Date.now() + Math.max(60, refreshed.expires_in) * 1000),
      scopes: refreshed.scope ? refreshed.scope.split(" ").filter(Boolean) : undefined,
      lastSyncAt: new Date(),
    },
  });

  return refreshed.access_token;
}
