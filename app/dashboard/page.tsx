import Link from "next/link";
import { connection } from "next/server";
import { CoachInsightCard } from "@/src/components/dashboard/coach-insight-card";
import { DashboardGreeting } from "@/src/components/dashboard/dashboard-greeting";
import { LevelProgress } from "@/src/components/dashboard/level-progress";
import { WeeklySummary } from "@/src/components/dashboard/weekly-summary";
import { WorkoutHero } from "@/src/components/dashboard/workout-hero";
import { AppShell } from "@/src/components/ui/app-shell";
import { GlassCard } from "@/src/components/ui/glass-card";
import { NavIcon } from "@/src/components/ui/nav-icon";
import { privatePageMetadata } from "@/src/lib/private-page-metadata";
import { getDashboardDataForDemoUser } from "@/src/server/fitness-queries";

const shortcuts = [
  { href: "/workout", label: "Séance", helper: "Lancer ou reprendre", icon: "workout" },
  { href: "/programs", label: "Plans", helper: "Ajuster le programme", icon: "programs" },
  { href: "/history", label: "Histo", helper: "Voir les séances", icon: "history" },
  { href: "/progress", label: "Progrès", helper: "Suivre l'évolution", icon: "progress" },
] as const;

export const metadata = privatePageMetadata(
  "Tableau de bord",
  "Tableau de bord privé FitAI Pro avec statistiques, objectifs et prochaine séance.",
);

export default async function DashboardPage() {
  await connection();
  const data = await getDashboardDataForDemoUser();

  return (
    <AppShell className="dashboard-home grid gap-4">
      <DashboardGreeting
        firstName={data.user.firstName}
        weeklySessions={data.weeklyStats.sessions}
        streakWeeks={data.streak.weeks}
        weeklyGoal={data.user.sessionsPerWeek}
      />

      <WorkoutHero workout={data.nextWorkout} />

      <WeeklySummary stats={data.weeklyStats} />

      <LevelProgress level={data.level} streakWeeks={data.streak.weeks} />

      <CoachInsightCard insight={data.coachInsight} />

      <section className="grid gap-3" aria-labelledby="dashboard-shortcuts-title">
        <div>
          <p className="m-0 text-[0.68rem] font-black uppercase tracking-[0.18em] text-[var(--fit-accent-cyan)]">
            Accès rapide
          </p>
          <h2 id="dashboard-shortcuts-title" className="m-0 mt-1 text-xl font-black tracking-[-0.04em]">
            Continuer
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {shortcuts.map((shortcut) => (
            <Link key={shortcut.href} href={shortcut.href} prefetch={false} className="outline-none">
              <GlassCard
                as="span"
                className="flex min-h-[96px] flex-col justify-between gap-3 p-3 transition hover:border-[var(--fit-border-strong)] focus-within:border-[var(--fit-border-strong)]"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-[rgba(47,143,255,.16)] text-[var(--fit-text)]">
                  <NavIcon name={shortcut.icon} className="h-5 w-5" />
                </span>
                <span>
                  <strong className="block text-sm font-black text-[var(--fit-text)]">{shortcut.label}</strong>
                  <span className="mt-1 block text-xs font-semibold text-[var(--fit-text-muted)]">{shortcut.helper}</span>
                </span>
              </GlassCard>
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
