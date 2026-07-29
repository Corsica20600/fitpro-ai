"use client";

import { useCallback, useEffect, useState } from "react";

type PlaybackState = {
  connected?: boolean;
  playing?: boolean;
  title?: string | null;
  artist?: string | null;
  imageUrl?: string | null;
};

type SpotifyNowPlayingProps = {
  displayName?: string | null;
};

export function SpotifyNowPlaying({ displayName }: SpotifyNowPlayingProps) {
  const [playback, setPlayback] = useState<PlaybackState | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/integrations/spotify/playback", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json() as PlaybackState;
      if (data.connected === false) return;
      setPlayback(data);
    } catch {
      setPlayback((current) => current ?? { connected: true, playing: false });
    }
  }, []);

  useEffect(() => {
    const bootId = window.setTimeout(() => void refresh(), 0);
    const id = window.setInterval(() => void refresh(), 20000);
    return () => {
      window.clearTimeout(bootId);
      window.clearInterval(id);
    };
  }, [refresh]);

  async function perform(action: "previous" | "play" | "next") {
    setBusyAction(action);
    try {
      await fetch("/api/integrations/spotify/playback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      window.setTimeout(() => void refresh(), 300);
      window.setTimeout(() => void refresh(), 1200);
    } finally {
      setBusyAction(null);
    }
  }

  const title = playback?.title || "Spotify connecté";
  const artist = playback?.artist || displayName || "Lecture prête";

  return (
    <section className="spotify-now-playing" aria-label="Spotify Now Playing">
      <div className="spotify-now-playing__art">
        {playback?.imageUrl ? (
          <span className="spotify-now-playing__cover" style={{ backgroundImage: `url(${playback.imageUrl})` }} aria-hidden="true" />
        ) : (
          <span aria-hidden="true">♪</span>
        )}
      </div>
      <div className="spotify-now-playing__text">
        <p className="eyebrow">Now Playing</p>
        <strong>{title}</strong>
        <small>{artist}</small>
      </div>
      <div className="spotify-now-playing__controls" aria-label="Contrôles Spotify">
        <button type="button" aria-label="Titre précédent" disabled={busyAction != null} onClick={() => void perform("previous")}>{"<<"}</button>
        <button type="button" aria-label="Lecture" disabled={busyAction != null} onClick={() => void perform("play")}>{">"}</button>
        <button type="button" aria-label="Titre suivant" disabled={busyAction != null} onClick={() => void perform("next")}>{">>"}</button>
      </div>
    </section>
  );
}
