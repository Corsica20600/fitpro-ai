"use client";

type WatchSyncCardProps = {
  busy: boolean;
  disabled: boolean;
  lastAttemptLabel: string;
  metricsCount: number;
  onRefresh: () => void;
};

export function WatchSyncCard({ busy, disabled, lastAttemptLabel, metricsCount, onRefresh }: WatchSyncCardProps) {
  return (
    <section className="watch-sync-card">
      <p className="eyebrow">Synchronisation</p>
      <h2>{busy ? "Synchronisation..." : "Prêt à synchroniser"}</h2>
      <div className="watch-sync-card__meta">
        <span>Dernière tentative: {lastAttemptLabel}</span>
        <span>Métriques séance: {metricsCount}</span>
      </div>
      <button type="button" className="primary-button" disabled={disabled || busy} onClick={onRefresh}>
        {busy ? "..." : "Synchroniser"}
      </button>
    </section>
  );
}
