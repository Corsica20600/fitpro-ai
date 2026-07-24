type MuscleDistributionProps = {
  items: Array<{
    group: string;
    sets: number;
    volume: number;
    percent: number;
  }>;
};

export function MuscleDistribution({ items }: MuscleDistributionProps) {
  if (items.length === 0) return null;
  const dominant = items[0];

  return (
    <section className="fit-glass-card muscle-distribution-card">
      <div className="progress-section-head">
        <div>
          <p className="fit-section-title__eyebrow">Répartition musculaire</p>
          <h2>Groupes travaillés</h2>
        </div>
        {dominant ? <span className="chip orange">Dominant: {dominant.group}</span> : null}
      </div>
      <p className="muted">Répartition calculée au nombre de séries réellement enregistrées.</p>

      <div className="muscle-distribution-list">
        {items.map((item) => (
          <div key={item.group} className="muscle-distribution-row">
            <div>
              <strong>{item.group}</strong>
              <span>{item.sets} séries · {Math.round(item.volume).toLocaleString("fr-FR")} kg</span>
            </div>
            <span className="muscle-distribution-track" aria-hidden="true">
              <i style={{ width: `${Math.max(4, item.percent)}%` }} />
            </span>
            <em>{item.percent}%</em>
          </div>
        ))}
      </div>
    </section>
  );
}
