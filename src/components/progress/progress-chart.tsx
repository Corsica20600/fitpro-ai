type ProgressChartProps = {
  title: string;
  description: string;
  bars: Array<{
    key: string;
    label: string;
    value: number;
    sessions: number;
  }>;
  valueFormatter: (value: number) => string;
  bestLabel?: string | null;
};

export function ProgressChart({ title, description, bars, valueFormatter, bestLabel }: ProgressChartProps) {
  const max = Math.max(1, ...bars.map((bar) => bar.value));
  const hasData = bars.some((bar) => bar.value > 0 || bar.sessions > 0);

  return (
    <section className="fit-glass-card progress-chart-card">
      <div className="progress-section-head">
        <div>
          <p className="fit-section-title__eyebrow">Évolution</p>
          <h2>{title}</h2>
        </div>
        {bestLabel ? <span className="chip success">Pic: {bestLabel}</span> : null}
      </div>
      <p className="muted">{description}</p>

      {hasData ? (
        <div className="progress-chart-bars" role="img" aria-label={`${title}. ${description}`}>
          {bars.map((bar) => {
            const height = Math.max(7, (bar.value / max) * 100);
            return (
              <div key={bar.key} className="progress-chart-bar">
                <span className="progress-chart-value">{valueFormatter(bar.value)}</span>
                <span className="progress-chart-track" aria-hidden="true">
                  <i style={{ height: `${height}%` }} />
                </span>
                <span className="progress-chart-label">{bar.label}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="muted">Pas encore de volume sur cette période.</p>
      )}
    </section>
  );
}
