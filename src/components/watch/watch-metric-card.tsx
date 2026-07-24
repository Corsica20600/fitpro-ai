"use client";

type WatchMetricCardProps = {
  label: string;
  value: string;
  unit?: string;
  detail?: string;
  unavailable?: boolean;
};

export function WatchMetricCard({ label, value, unit, detail, unavailable = false }: WatchMetricCardProps) {
  return (
    <article className={`watch-metric-card ${unavailable ? "is-unavailable" : ""}`.trim()}>
      <p>{label}</p>
      <strong>{value}{unit ? <small>{unit}</small> : null}</strong>
      {detail ? <span>{detail}</span> : null}
    </article>
  );
}
