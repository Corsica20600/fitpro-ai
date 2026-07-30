import { parseSessionNotesMeta } from "@/src/server/session-exercise-replacements";

type SessionSummaryProps = {
  statusLabel: string;
  durationLabel: string;
  volumeLabel: string;
  exerciseCount: number;
  setsCount: number;
  notes?: string | null;
};

type SummaryIconName = "status" | "duration" | "volume" | "exercises" | "sets";

const summaryIconPaths: Record<SummaryIconName, string> = {
  status: "M9.2 16.6 4.9 12.3 3.5 13.7 9.2 19.4 20.7 7.9 19.3 6.5 9.2 16.6Z",
  duration: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 5h-2v6.1l4.6 2.7 1-1.7-3.6-2.1V7Z",
  volume: "M4 10h2v4H4v-4Zm3-2h2v8H7V8Zm3 3h4v2h-4v-2Zm5-3h2v8h-2V8Zm3 2h2v4h-2v-4Z",
  exercises: "M5 4h14v3H5V4Zm0 6h14v3H5v-3Zm0 6h14v3H5v-3Z",
  sets: "M6 5h12v3H6V5Zm-2 6h16v3H4v-3Zm2 6h12v3H6v-3Z",
};

function SummaryIcon({ name }: { name: SummaryIconName }) {
  return (
    <span className="history-summary-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false">
        <path d={summaryIconPaths[name]} />
      </svg>
    </span>
  );
}

export function SessionSummary({
  statusLabel,
  durationLabel,
  volumeLabel,
  exerciseCount,
  setsCount,
  notes,
}: SessionSummaryProps) {
  const displayNotes = parseSessionNotesMeta(notes).text?.trim() ?? null;

  return (
    <section className="fit-glass-card history-summary-card">
      <p className="fit-section-title__eyebrow">Résumé général</p>
      <div className="history-summary-grid">
        <span className="history-summary-item"><SummaryIcon name="status" /><b>{statusLabel}</b><small>statut</small></span>
        <span className="history-summary-item"><SummaryIcon name="duration" /><b>{durationLabel}</b><small>durée</small></span>
        <span className="history-summary-item"><SummaryIcon name="volume" /><b>{volumeLabel}</b><small>volume</small></span>
        <span className="history-summary-item"><SummaryIcon name="exercises" /><b>{exerciseCount}</b><small>exercices</small></span>
        <span className="history-summary-item"><SummaryIcon name="sets" /><b>{setsCount}</b><small>séries</small></span>
      </div>
      {displayNotes ? <p className="muted history-summary-note">Notes: {displayNotes}</p> : null}
    </section>
  );
}
