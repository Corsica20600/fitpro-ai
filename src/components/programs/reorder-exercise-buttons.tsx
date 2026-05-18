"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ReorderExerciseButtons({
  programId,
  exerciseId,
  isFirst,
  isLast,
}: {
  programId: string;
  exerciseId: string;
  isFirst: boolean;
  isLast: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"up" | "down" | null>(null);

  async function move(direction: "up" | "down") {
    if (busy || (direction === "up" && isFirst) || (direction === "down" && isLast)) return;
    setBusy(direction);
    try {
      const res = await fetch(`/api/programs/${encodeURIComponent(programId)}/exercises/reorder`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ exerciseId, direction }),
      });
      if (!res.ok) return;
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="reorder-controls" aria-label="Reordonner exercice">
      <button
        type="button"
        className={`reorder-btn ${isFirst ? "is-disabled" : ""}`}
        disabled={busy !== null}
        onClick={() => void move("up")}
        aria-label="Monter l'exercice"
        aria-disabled={isFirst}
        title={isFirst ? "Premier exercice (impossible de monter)" : "Monter"}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 5.5 5.8 11.7a1 1 0 1 0 1.4 1.4L11 9.3V18a1 1 0 1 0 2 0V9.3l3.8 3.8a1 1 0 1 0 1.4-1.4z" />
        </svg>
      </button>
      <button
        type="button"
        className={`reorder-btn ${isLast ? "is-disabled" : ""}`}
        disabled={busy !== null}
        onClick={() => void move("down")}
        aria-label="Descendre l'exercice"
        aria-disabled={isLast}
        title={isLast ? "Dernier exercice (impossible de descendre)" : "Descendre"}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 18.5 18.2 12.3a1 1 0 1 0-1.4-1.4L13 14.7V6a1 1 0 1 0-2 0v8.7l-3.8-3.8a1 1 0 1 0-1.4 1.4z" />
        </svg>
      </button>
    </div>
  );
}
