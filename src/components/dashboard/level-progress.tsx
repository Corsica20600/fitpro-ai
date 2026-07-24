import { GlassCard } from "@/src/components/ui/glass-card";
import { ProgressBar } from "@/src/components/ui/progress-bar";
import { ProgressRing } from "@/src/components/ui/progress-ring";

type LevelProgressProps = {
  level: {
    level: number;
    totalXp: number;
    xpInLevel: number;
    xpForNextLevel: number;
    progressPercent: number;
    sessionsToNextLevel: number;
  };
  streakWeeks: number;
};

export function LevelProgress({ level, streakWeeks }: LevelProgressProps) {
  return (
    <GlassCard elevated className="grid gap-4 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="m-0 text-[0.68rem] font-black uppercase tracking-[0.18em] text-[var(--fit-accent-cyan)]">
            Progression
          </p>
          <h2 className="m-0 mt-1 text-xl font-black tracking-[-0.04em]">Niveau {level.level}</h2>
          <p className="m-0 mt-1 text-sm font-semibold text-[var(--fit-text-muted)]">
            {level.sessionsToNextLevel} séance{level.sessionsToNextLevel > 1 ? "s" : ""} environ avant le niveau suivant
          </p>
        </div>
        <ProgressRing
          value={level.xpInLevel}
          max={level.xpForNextLevel}
          size={96}
          strokeWidth={9}
          valueLabel={`${level.progressPercent}%`}
          label="XP"
          ariaLabel={`Progression niveau ${level.level}: ${level.progressPercent}%`}
        />
      </div>
      <ProgressBar
        value={level.xpInLevel}
        max={level.xpForNextLevel}
        label={`${level.xpInLevel} / ${level.xpForNextLevel} XP`}
        valueLabel={`${level.totalXp} XP total`}
      />
      <p className="m-0 rounded-2xl border border-[rgba(111,162,255,.18)] bg-[rgba(3,8,18,.38)] px-3 py-2 text-xs font-semibold text-[var(--fit-text-muted)]">
        Formule gamifiée: 100 XP par séance terminée + 25 XP par semaine de série active. Série actuelle: {streakWeeks} semaine{streakWeeks > 1 ? "s" : ""}.
      </p>
    </GlassCard>
  );
}
