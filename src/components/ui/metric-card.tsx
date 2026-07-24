import type { ReactNode } from "react";

type MetricCardProps = {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  icon?: ReactNode;
  tone?: "accent" | "success" | "warning" | "danger" | "violet" | "neutral";
  className?: string;
};

export function MetricCard({
  label,
  value,
  detail,
  icon,
  tone = "neutral",
  className = "",
}: MetricCardProps) {
  return (
    <article className={`fit-metric-card fit-metric-card--${tone} ${className}`.trim()}>
      {icon ? <span className="fit-metric-card__icon" aria-hidden="true">{icon}</span> : null}
      <span className="fit-metric-card__label">{label}</span>
      <strong className="fit-metric-card__value">{value}</strong>
      {detail ? <span className="fit-metric-card__detail">{detail}</span> : null}
    </article>
  );
}
