"use client";

import { useEffect, useMemo, useState } from "react";
import { GlassCard } from "@/src/components/ui/glass-card";

type DashboardGreetingProps = {
  firstName: string | null;
  weeklySessions: number;
  streakWeeks: number;
  weeklyGoal: number | null;
  motivation?: {
    streakLabel: string | null;
    weeklyGoalLabel: string;
    xpToday: number;
  };
};

type DayMoment = "morning" | "afternoon" | "evening";

export function getDayMoment(hour: number): DayMoment {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  return "evening";
}

function getGreetingCopy(moment: DayMoment) {
  if (moment === "morning") {
    return {
      greeting: "Bonjour",
      helper: "Prêt à bien commencer la journée ?",
    };
  }
  if (moment === "afternoon") {
    return {
      greeting: "Bon après-midi",
      helper: "Prêt pour ta prochaine séance ?",
    };
  }
  return {
    greeting: "Bonsoir",
    helper: "Une dernière séance pour finir fort ?",
  };
}

export function DashboardGreeting({ firstName, weeklySessions, streakWeeks, weeklyGoal, motivation }: DashboardGreetingProps) {
  const [moment, setMoment] = useState<DayMoment>("afternoon");
  const displayName = firstName?.trim() || "Utilisateur Traknio";
  const copy = getGreetingCopy(moment);
  const activityLabel =
    motivation?.streakLabel ||
    (weeklySessions > 0
      ? `${weeklySessions} séance${weeklySessions > 1 ? "s" : ""} cette semaine`
      : streakWeeks > 0
        ? `Série de ${streakWeeks} semaine${streakWeeks > 1 ? "s" : ""}`
        : weeklyGoal
          ? `Objectif: ${weeklyGoal} séance${weeklyGoal > 1 ? "s" : ""}/semaine`
          : null);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setMoment(getDayMoment(new Date().getHours()));
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const greeting = useMemo(() => copy.greeting.replace("-", "\u2011"), [copy.greeting]);

  return (
    <GlassCard className="grid gap-3 px-4 py-4">
      <p className="m-0 text-[0.72rem] font-black uppercase tracking-[0.18em] text-[var(--fit-accent-cyan)]">
        Accueil
      </p>
      <div className="flex min-w-0 flex-col items-start gap-3 min-[390px]:flex-row min-[390px]:items-end min-[390px]:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="m-0 max-w-full text-[clamp(1.65rem,7vw,2.05rem)] font-black leading-[1.04] tracking-[-0.045em] text-[var(--fit-text)]">
            <span className="whitespace-nowrap">{greeting}</span>{" "}
            <span className="whitespace-nowrap">{displayName}</span>
          </h1>
          <p className="m-0 mt-2 text-sm font-semibold text-[var(--fit-text-muted)]">
            {copy.helper}
          </p>
        </div>
        {activityLabel || motivation ? (
          <span className="dashboard-motivation-pill">
            {activityLabel ? <b>{activityLabel}</b> : null}
            {motivation ? <small>{motivation.weeklyGoalLabel}{motivation.xpToday > 0 ? ` · +${motivation.xpToday} XP aujourd'hui` : ""}</small> : null}
          </span>
        ) : null}
      </div>
    </GlassCard>
  );
}
