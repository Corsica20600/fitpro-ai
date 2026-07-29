import { parseSessionNotesMeta } from "@/src/server/session-exercise-replacements";

type SessionSummaryProps = {
  statusLabel: string;
  durationLabel: string;
  volumeLabel: string;
  exerciseCount: number;
  setsCount: number;
  notes?: string | null;
};

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
        <span><b>{statusLabel}</b> statut</span>
        <span><b>{durationLabel}</b> durée</span>
        <span><b>{volumeLabel}</b> volume</span>
        <span><b>{exerciseCount}</b> exercices</span>
        <span><b>{setsCount}</b> séries</span>
      </div>
      {displayNotes ? <p className="muted history-summary-note">Notes: {displayNotes}</p> : null}
    </section>
  );
}
