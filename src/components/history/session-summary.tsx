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
      {notes ? <p className="muted">Notes: {notes}</p> : null}
    </section>
  );
}
