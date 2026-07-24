"use client";

type WatchStatusCardProps = {
  loading: boolean;
  hasState: boolean;
  error: string | null;
  subtitle: string;
};

export function WatchStatusCard({ loading, hasState, error, subtitle }: WatchStatusCardProps) {
  const tone = loading ? "neutral" : hasState ? "success" : error ? "warning" : "neutral";
  const label = loading ? "Connexion en cours" : hasState ? "Montre opérationnelle" : "Aucune séance active";

  return (
    <section className={`watch-status-card watch-status-card--${tone}`}>
      <p className="eyebrow">État de connexion</p>
      <h1>Montre</h1>
      <strong>{label}</strong>
      <p>{subtitle}</p>
      {error ? <span role="status">{error}</span> : null}
    </section>
  );
}
