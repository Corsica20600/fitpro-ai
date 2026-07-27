"use client";

import Link from "next/link";
import { useCallback } from "react";
import { spotifyOpenTarget } from "@/src/lib/spotify-open";

type SpotifyOpenLinkProps = {
  connected: boolean;
  className?: string;
};

export function SpotifyOpenLink({ connected, className = "ghost-btn" }: SpotifyOpenLinkProps) {
  const openSpotify = useCallback(() => {
    const fallbackTimer = window.setTimeout(() => {
      window.open(spotifyOpenTarget.fallbackWebUrl, "_blank", "noopener,noreferrer");
    }, 700);

    window.location.href = spotifyOpenTarget.deepLinkUrl;

    window.setTimeout(() => window.clearTimeout(fallbackTimer), 1600);
  }, []);

  if (!connected) {
    return (
      <Link href="/settings" className={className}>
        Connecter Spotify
      </Link>
    );
  }

  return (
    <button type="button" className={className} onClick={openSpotify}>
      Ouvrir {spotifyOpenTarget.appName}
    </button>
  );
}
