"use client";

import { useMemo, useState } from "react";

type MediaItem = {
  type: "IMAGE" | "THUMBNAIL" | "ANIMATION";
  url?: string | null;
  publicUrl?: string | null;
};

function mediaPath(media: MediaItem | undefined, fallback: string) {
  if (!media) return fallback;
  return media.publicUrl || media.url || fallback;
}

export function ExerciseMediaPreview({
  media,
  fallbackThumbnail,
  fallbackAnimation,
}: {
  media: MediaItem[];
  fallbackThumbnail: string;
  fallbackAnimation: string;
}) {
  const thumb = useMemo(
    () =>
      mediaPath(media.find((m) => m.type === "THUMBNAIL"), fallbackThumbnail) ||
      mediaPath(media.find((m) => m.type === "IMAGE"), fallbackThumbnail),
    [media, fallbackThumbnail],
  );

  const anim = useMemo(
    () => mediaPath(media.find((m) => m.type === "ANIMATION"), fallbackAnimation),
    [media, fallbackAnimation],
  );

  const [imgSrc, setImgSrc] = useState(thumb);

  return (
    <div className="exercise-media">
      <img
        src={imgSrc}
        alt="exercise thumbnail"
        className="exercise-thumb"
        onError={() => setImgSrc("/media/exercises/fallback-thumb.svg")}
      />
      <div className="exercise-media-meta">
        <span className="eyebrow">Animation</span>
        <p className="muted small">{anim}</p>
      </div>
    </div>
  );
}
