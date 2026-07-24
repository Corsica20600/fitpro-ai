import { GlassCard } from "@/src/components/ui/glass-card";

type DashboardGreetingProps = {
  firstName: string;
  weeklySessions: number;
  streakWeeks: number;
  weeklyGoal: number | null;
};

function getGreeting() {
  const hour = Number(new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    hour12: false,
    timeZone: "Europe/Paris",
  }).format(new Date()));

  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon après-midi";
  return "Bonsoir";
}

export function DashboardGreeting({ firstName, weeklySessions, streakWeeks, weeklyGoal }: DashboardGreetingProps) {
  const helper =
    weeklySessions > 0
      ? `${weeklySessions} séance${weeklySessions > 1 ? "s" : ""} cette semaine`
      : streakWeeks > 0
        ? `Série de ${streakWeeks} semaine${streakWeeks > 1 ? "s" : ""}`
        : weeklyGoal
          ? `Objectif: ${weeklyGoal} séance${weeklyGoal > 1 ? "s" : ""}/semaine`
          : null;

  return (
    <GlassCard className="grid gap-2 px-4 py-4">
      <p className="m-0 text-[0.72rem] font-black uppercase tracking-[0.18em] text-[var(--fit-accent-cyan)]">
        Accueil
      </p>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="m-0 text-[1.72rem] font-black leading-[1.02] tracking-[-0.05em] text-[var(--fit-text)]">
            {getGreeting()} {firstName}
          </h1>
          <p className="m-0 mt-2 text-sm font-semibold text-[var(--fit-text-muted)]">
            Prêt pour ta prochaine séance ?
          </p>
        </div>
        {helper ? (
          <span className="shrink-0 rounded-full border border-[rgba(55,215,255,.32)] bg-[rgba(55,215,255,.08)] px-3 py-2 text-right text-[0.72rem] font-black leading-tight text-[var(--fit-text-soft)]">
            {helper}
          </span>
        ) : null}
      </div>
    </GlassCard>
  );
}
