"use client";
import { useState } from "react";

type MediaLike = {
  type: "IMAGE" | "THUMBNAIL" | "ANIMATION";
  publicUrl?: string | null;
  url?: string | null;
  format?: string | null;
};

function extOf(path: string) {
  const value = path.split("?")[0] ?? "";
  const dot = value.lastIndexOf(".");
  return dot > -1 ? value.slice(dot + 1).toLowerCase() : "";
}

function pickMedia(media: MediaLike[], preferredType: MediaLike["type"]) {
  return media.find((item) => item.type === preferredType && (item.publicUrl || item.url));
}

export function ExerciseVisual({
  media,
  fallbackImage,
  fallbackAnimation,
  title,
  className = "",
  compact = false,
}: {
  media: MediaLike[];
  fallbackImage?: string | null;
  fallbackAnimation?: string | null;
  title: string;
  className?: string;
  compact?: boolean;
}) {
  const [animationFailed, setAnimationFailed] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const thumbnail = pickMedia(media, "THUMBNAIL");
  const image = pickMedia(media, "IMAGE");
  const animation = pickMedia(media, "ANIMATION");

  const preferredImageSrc =
    thumbnail?.publicUrl ||
    thumbnail?.url ||
    image?.publicUrl ||
    image?.url ||
    "";
  const animSrc = animation?.publicUrl || animation?.url || fallbackAnimation || "";
  const imageSrc = preferredImageSrc || fallbackImage || "";

  const format = (animation?.format || extOf(animSrc)).toLowerCase();

  const isVideo = format === "mp4" || format === "webm";
  const isGifOrWebp = format === "gif" || format === "webp" || format === "apng";
  const isLottie = format === "lottie" || format === "json";

  if (!animationFailed && animSrc && isVideo) {
    return (
      <div className={`exercise-visual ${compact ? "compact" : ""} ${className}`.trim()}>
        <video
          className="exercise-visual-media"
          src={animSrc}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          onError={() => setAnimationFailed(true)}
        />
      </div>
    );
  }

  if (!animationFailed && animSrc && isGifOrWebp) {
    return (
      <div className={`exercise-visual ${compact ? "compact" : ""} ${className}`.trim()}>
        <img
          className="exercise-visual-media"
          src={animSrc}
          alt={title}
          loading="lazy"
          decoding="async"
          onError={() => setAnimationFailed(true)}
        />
      </div>
    );
  }

  if (!animationFailed && animSrc && isLottie) {
    return (
      <div className={`exercise-visual ${compact ? "compact" : ""} ${className}`.trim()}>
        <div className="exercise-visual-placeholder lottie-ready" />
      </div>
    );
  }

  if (!imageFailed && imageSrc) {
    return (
      <div className={`exercise-visual ${compact ? "compact" : ""} ${className}`.trim()}>
        <img
          className="exercise-visual-media"
          src={imageSrc}
          alt={title}
          loading="lazy"
          decoding="async"
          onError={() => setImageFailed(true)}
        />
      </div>
    );
  }

  return (
    <div className={`exercise-visual ${compact ? "compact" : ""} ${className}`.trim()}>
      <div className="exercise-visual-placeholder">
        <div className="silhouette" aria-hidden="true" />
      </div>
    </div>
  );
}
