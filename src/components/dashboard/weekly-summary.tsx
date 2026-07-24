import { MetricCard } from "@/src/components/ui/metric-card";
import { NavIcon } from "@/src/components/ui/nav-icon";

type WeeklySummaryProps = {
  stats: {
    sessions: number;
    volume: number;
    durationSeconds: number;
    sets: number;
    comparisonPercent: number | null;
  };
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(value));
}

function formatDuration(seconds: number) {
  if (seconds <= 0) return "N/A";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  if (hours <= 0) return `${minutes} min`;
  return `${hours} h ${minutes.toString().padStart(2, "0")}`;
}

function formatComparison(value: number | null) {
  if (value == null) return "Comparaison indisponible";
  if (value === 0) return "Stable vs semaine dernière";
  return `${value > 0 ? "+" : ""}${value}% vs semaine dernière`;
}

function metricIcon(name: "dashboard" | "workout" | "history" | "progress") {
  return <NavIcon name={name} className="h-5 w-5 text-[var(--fit-text-soft)]" />;
}

export function WeeklySummary({ stats }: WeeklySummaryProps) {
  const cards = [
    {
      label: "Séances",
      value: stats.sessions,
      detail: stats.sessions > 0 ? "Cette semaine" : "À lancer",
      tone: "accent" as const,
      icon: metricIcon("workout"),
    },
    {
      label: "Volume",
      value: <span className="whitespace-nowrap text-[1.08rem]">{formatNumber(stats.volume)} kg</span>,
      detail: formatComparison(stats.comparisonPercent),
      tone: stats.comparisonPercent != null && stats.comparisonPercent >= 0 ? "success" as const : "warning" as const,
      icon: metricIcon("progress"),
    },
    {
      label: "Durée",
      value: formatDuration(stats.durationSeconds),
      detail: stats.durationSeconds > 0 ? "Temps total" : "Après ta séance",
      tone: "violet" as const,
      icon: metricIcon("history"),
    },
    {
      label: "Séries",
      value: formatNumber(stats.sets),
      detail: stats.sets > 0 ? "Séries validées" : "Pas encore",
      tone: "neutral" as const,
      icon: metricIcon("dashboard"),
    },
  ];

  return (
    <section className="grid gap-3" aria-labelledby="weekly-summary-title">
      <div>
        <p className="m-0 text-[0.68rem] font-black uppercase tracking-[0.18em] text-[var(--fit-accent-cyan)]">
          Résumé
        </p>
        <h2 id="weekly-summary-title" className="m-0 mt-1 text-xl font-black tracking-[-0.04em]">
          Cette semaine
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-3 min-[1080px]:grid-cols-4">
        {cards.map((card) => (
          <MetricCard key={card.label} {...card} className="min-w-0 [&_.fit-metric-card__value]:break-words [&_.fit-metric-card__value]:text-[1.32rem]" />
        ))}
      </div>
    </section>
  );
}
