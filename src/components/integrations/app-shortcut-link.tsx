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

    try {
      window.location.href = deepLinkUrl;
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
