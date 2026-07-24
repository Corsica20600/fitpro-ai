import { GlassCard } from "@/src/components/ui/glass-card";
import { StatBadge } from "@/src/components/ui/stat-badge";

type CoachInsightCardProps = {
  insight: {
    title: string;
    message: string;
    tone: "accent" | "success" | "warning" | "orange" | "violet";
  };
};

export function CoachInsightCard({ insight }: CoachInsightCardProps) {
  return (
    <GlassCard className="grid gap-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="m-0 text-[0.68rem] font-black uppercase tracking-[0.18em] text-[var(--fit-accent-cyan)]">
            FitAI Coach
          </p>
          <h2 className="m-0 mt-1 text-xl font-black tracking-[-0.04em]">{insight.title}</h2>
        </div>
        <StatBadge tone={insight.tone}>Conseil</StatBadge>
      </div>
      <p className="m-0 text-sm font-semibold leading-relaxed text-[var(--fit-text-muted)]">
        {insight.message}
      </p>
    </GlassCard>
  );
}
