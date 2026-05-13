import Link from "next/link";
import { AppShell } from "@/src/components/ui/app-shell";
import { HeroVisual } from "@/src/components/ui/hero-visual";
import { PrimaryAction } from "@/src/components/ui/primary-action";
import { WorkoutCard } from "@/src/components/ui/workout-card";
import { getWorkoutPageData } from "@/src/server/fitness-queries";

export default async function DashboardPage() {
  const { currentSession, exercises } = await getWorkoutPageData();
  const activeExercise = exercises[0] ?? null;
  const currentSetIndex = (currentSession?.sets?.length ?? 0) + 1;
  const currentExerciseIndex = 1;
  const totalExercises = currentSession ? 6 : 0;
  const restSeconds = currentSession?.sets?.[0]?.restSeconds ?? 90;
  const progressPercent = currentSession ? Math.min(100, Math.max(6, Math.round((currentExerciseIndex / Math.max(1, totalExercises)) * 100))) : 0;
  const heroTitle = activeExercise?.nameFr || activeExercise?.name || "Move Today";
  const heroImage = activeExercise?.fallbackImagePath || activeExercise?.fallbackThumbnailPath || "/media/exercises/air-bike/0.jpg";
  const startLabel = currentSession ? "Demarrer" : "Demarrer";

  return (
    <AppShell className="stack dashboard-premium-screen">
      <HeroVisual title={heroTitle} imageSrc={heroImage} imageAlt={heroTitle} eyebrow="FitAI Pro" className="dashboard-premium-hero">
        <Link href="/workout" className="dashboard-premium-action">
          <PrimaryAction className="dashboard-premium-cta">{startLabel}</PrimaryAction>
        </Link>
      </HeroVisual>

      <WorkoutCard className="dashboard-program-card" light>
        <p className="eyebrow">Programme du jour</p>
        <div className="dashboard-program-main">
          <img src={heroImage} alt={heroTitle} className="dashboard-program-image" />
          <div>
            <h2>{currentSession ? "Bloc principal" : "Pret a lancer"}</h2>
            <p>{currentSession ? heroTitle : "Session full body courte"}</p>
          </div>
        </div>
      </WorkoutCard>

      <section className="dashboard-quick-chips">
        <span className="dashboard-quick-chip">Exercice {currentSession ? `${currentExerciseIndex}/${totalExercises}` : "-"}</span>
        <span className="dashboard-quick-chip">Serie {currentSession ? currentSetIndex : "-"}</span>
        <span className="dashboard-quick-chip">Repos {currentSession ? `${restSeconds}s` : "-"}</span>
        <span className="dashboard-quick-chip">Progress {currentSession ? `${progressPercent}%` : "0%"}</span>
      </section>

      {currentSession ? (
        <section className="dashboard-progress-bar-card">
          <div className="dashboard-progress-head">
            <span>Progression seance</span>
            <strong>{progressPercent}%</strong>
          </div>
          <div className="dashboard-progress-track">
            <span style={{ width: `${progressPercent}%` }} />
          </div>
        </section>
      ) : null}

      <section className="dashboard-mini-stats">
        <span className="chip">Semaine 2/4</span>
        <span className="chip">Volume 12 480</span>
        <span className="chip">Streak 3j</span>
      </section>
    </AppShell>
  );
}
