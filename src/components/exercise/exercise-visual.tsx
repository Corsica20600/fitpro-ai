"use client";
import { useEffect, useMemo, useState } from "react";

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
  frameAnimationUrls = [],
  frameIntervalMs = 700,
  title,
  className = "",
  compact = false,
}: {
  media: MediaLike[];
  fallbackImage?: string | null;
  fallbackAnimation?: string | null;
  frameAnimationUrls?: string[];
  frameIntervalMs?: number;
  title: string;
  className?: string;
  compact?: boolean;
}) {
  const [animationFailed, setAnimationFailed] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [frameIndex, setFrameIndex] = useState(0);
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
  const hasFrameAnimation = frameAnimationUrls.length > 0;
  const activeFrameSrc = useMemo(() => {
    if (!hasFrameAnimation) return "";
    const safeIndex = Math.max(0, Math.min(frameAnimationUrls.length - 1, frameIndex));
    return frameAnimationUrls[safeIndex] ?? "";
  }, [frameAnimationUrls, frameIndex, hasFrameAnimation]);

  useEffect(() => {
    if (!hasFrameAnimation || !isPlaying) return;
    const interval = window.setInterval(() => {
      setFrameIndex((value) => (value + 1) % frameAnimationUrls.length);
    }, Math.max(200, frameIntervalMs));
    return () => window.clearInterval(interval);
  }, [frameAnimationUrls.length, frameIntervalMs, hasFrameAnimation, isPlaying]);

  if (!animationFailed && hasFrameAnimation && activeFrameSrc) {
    return (
      <div className={`exercise-visual ${compact ? "compact" : ""} ${className}`.trim()}>
        <img
          className="exercise-visual-media exercise-visual-media-contain"
          src={activeFrameSrc}
          alt={title}
          loading="lazy"
          decoding="async"
          onError={() => setAnimationFailed(true)}
        />
        <button
          type="button"
          className="exercise-visual-toggle"
          onClick={() => setIsPlaying((prev) => !prev)}
          aria-label={isPlaying ? "Mettre en pause l'animation" : "Relancer l'animation"}
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
      </div>
    );
  }

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
