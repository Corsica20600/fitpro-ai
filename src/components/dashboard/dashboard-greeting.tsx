"use client";

import { useEffect, useMemo, useState } from "react";
import { GlassCard } from "@/src/components/ui/glass-card";

type DashboardGreetingProps = {
  firstName: string | null;
  weeklySessions: number;
  streakWeeks: number;
  weeklyGoal: number | null;
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

export function DashboardGreeting({ firstName, weeklySessions, streakWeeks, weeklyGoal }: DashboardGreetingProps) {
  const [moment, setMoment] = useState<DayMoment>("afternoon");
  const displayName = firstName?.trim() || "Utilisateur FitAI";
  const copy = getGreetingCopy(moment);
  const activityLabel =
    weeklySessions > 0
      ? `${weeklySessions} séance${weeklySessions > 1 ? "s" : ""} cette semaine`
      : streakWeeks > 0
        ? `Série de ${streakWeeks} semaine${streakWeeks > 1 ? "s" : ""}`
        : weeklyGoal
          ? `Objectif: ${weeklyGoal} séance${weeklyGoal > 1 ? "s" : ""}/semaine`
          : null;

  useEffect(() => {
    const id = window.setTimeout(() => {
      setMoment(getDayMoment(new Date().getHours()));
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const title = useMemo(() => `${copy.greeting} ${displayName}`, [copy.greeting, displayName]);

  return (
    <GlassCard className="grid gap-2 px-4 py-4">
      <p className="m-0 text-[0.72rem] font-black uppercase tracking-[0.18em] text-[var(--fit-accent-cyan)]">
        Accueil
      </p>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="m-0 text-[1.72rem] font-black leading-[1.02] tracking-[-0.05em] text-[var(--fit-text)]">
            {title}
          </h1>
          <p className="m-0 mt-2 text-sm font-semibold text-[var(--fit-text-muted)]">
            {copy.helper}
          </p>
        </div>
        {activityLabel ? (
          <span className="shrink-0 rounded-full border border-[rgba(55,215,255,.32)] bg-[rgba(55,215,255,.08)] px-3 py-2 text-right text-[0.72rem] font-black leading-tight text-[var(--fit-text-soft)]">
            {activityLabel}
          </span>
        ) : null}
      </div>
    </GlassCard>
  );
}
