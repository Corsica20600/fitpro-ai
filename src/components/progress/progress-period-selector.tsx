import Link from "next/link";

type ProgressPeriodSelectorProps = {
  activePeriod: string;
  periods: Array<{ key: string; label: string }>;
};

export function ProgressPeriodSelector({ activePeriod, periods }: ProgressPeriodSelectorProps) {
  return (
    <nav className="progress-period-selector" aria-label="Période de progression">
      {periods.map((period) => {
        const isActive = period.key === activePeriod;
        return (
          <Link
            key={period.key}
            href={`/progress?period=${period.key}`}
            className={`progress-period-pill ${isActive ? "active" : ""}`.trim()}
            aria-current={isActive ? "page" : undefined}
          >
            {period.label}
          </Link>
        );
      })}
    </nav>
  );
}
