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
    const startedAt = Date.now();
    const timeout = window.setTimeout(() => {
      // If user stayed on page, app likely not installed: fallback to web URL.
      if (Date.now() - startedAt < 1400) {
        window.open(fallbackWebUrl, "_blank", "noopener,noreferrer");
      }
    }, 900);

    try {
      window.location.href = deepLinkUrl;
    } finally {
      window.setTimeout(() => window.clearTimeout(timeout), 2000);
    }
  }, [deepLinkUrl, fallbackWebUrl]);

  return (
    <button type="button" className={className} onClick={onClick}>
      {label}
    </button>
  );
}

