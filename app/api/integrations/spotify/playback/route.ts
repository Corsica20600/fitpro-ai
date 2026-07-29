import { NextResponse } from "next/server";
import { getAuthenticatedUserProfile } from "@/src/server/fitness-queries";
import { getSpotifyAccessTokenForProfile } from "@/src/server/spotify";

type SpotifyPlaybackItem = {
  name?: string;
  artists?: Array<{ name?: string }>;
  album?: {
    images?: Array<{ url?: string; width?: number; height?: number }>;
  };
};

async function spotifyFetch(path: string, accessToken: string, init?: RequestInit) {
  return fetch(`https://api.spotify.com/v1${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${accessToken}`,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
}

export async function GET() {
  const profile = await getAuthenticatedUserProfile().catch(() => null);
  if (!profile) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const accessToken = await getSpotifyAccessTokenForProfile(profile.id).catch(() => null);
  if (!accessToken) return NextResponse.json({ connected: false });

  const response = await spotifyFetch("/me/player/currently-playing", accessToken);
  if (response.status === 204 || response.status === 404) {
    return NextResponse.json({ connected: true, playing: false });
  }
  if (!response.ok) {
    return NextResponse.json({ connected: true, playing: false, error: "spotify_unavailable" }, { status: 200 });
  }

  const payload = await response.json().catch(() => null) as {
    is_playing?: boolean;
    item?: SpotifyPlaybackItem | null;
  } | null;
  const item = payload?.item ?? null;

  return NextResponse.json({
    connected: true,
    playing: Boolean(payload?.is_playing),
    title: item?.name ?? null,
    artist: item?.artists?.map((artist) => artist.name).filter(Boolean).join(", ") || null,
    imageUrl: item?.album?.images?.[0]?.url ?? null,
  });
}

export async function POST(request: Request) {
  const profile = await getAuthenticatedUserProfile().catch(() => null);
  if (!profile) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const accessToken = await getSpotifyAccessTokenForProfile(profile.id).catch(() => null);
  if (!accessToken) return NextResponse.json({ error: "spotify_not_connected" }, { status: 404 });

  const body = await request.json().catch(() => ({})) as { action?: string };
  const action = String(body.action ?? "").trim();
  const actions: Record<string, { path: string; method: "POST" | "PUT" }> = {
    previous: { path: "/me/player/previous", method: "POST" },
    play: { path: "/me/player/play", method: "PUT" },
    next: { path: "/me/player/next", method: "POST" },
  };
  const target = actions[action];
  if (!target) return NextResponse.json({ error: "invalid_action" }, { status: 400 });

  const response = await spotifyFetch(target.path, accessToken, { method: target.method });
  if (!response.ok && response.status !== 204) {
    return NextResponse.json({ ok: false, error: "spotify_action_failed" }, { status: 200 });
  }

  return NextResponse.json({ ok: true });
}
