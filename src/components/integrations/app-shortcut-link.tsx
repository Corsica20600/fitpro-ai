"use client";

import { useCallback } from "react";

export function AppShortcutLink({
  label,
  deepLinkUrl,
  fallbackWebUrl,
  className = "outline-link",
}: {
  label: string;
  deepLinkUrl: string;
  fallbackWebUrl: string;
  className?: string;
}) {
  const onClick = useCallback(() => {
    const ua = navigator.userAgent.toLowerCase();
    const isAndroid = ua.includes("android");
    const isLikelyWebView = ua.includes("wv") || ua.includes("version/");

    // On non-Android contexts, always use web fallback to avoid unsupported-scheme crashes.
    if (!isAndroid) {
      window.open(fallbackWebUrl, "_blank", "noopener,noreferrer");
      return;
    }

    let appOpened = false;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        appOpened = true;
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    const timeout = window.setTimeout(() => {
      if (!appOpened) {
        window.open(fallbackWebUrl, "_blank", "noopener,noreferrer");
      }
      document.removeEventListener("visibilitychange", onVisibility);
    }, 1200);

    const targetDeepLink =
      deepLinkUrl.startsWith("intent://") && !isLikelyWebView
        ? fallbackWebUrl
        : deepLinkUrl;

    try {
      window.location.assign(targetDeepLink);
    } catch {
      window.open(fallbackWebUrl, "_blank", "noopener,noreferrer");
    } finally {
      window.setTimeout(() => window.clearTimeout(timeout), 2500);
    }
  }, [deepLinkUrl, fallbackWebUrl]);

  return (
    <button type="button" className={className} onClick={onClick}>
      {label}
    </button>
  );
}
