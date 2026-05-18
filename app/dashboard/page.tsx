import Link from "next/link";
import Image from "next/image";
import { connection } from "next/server";
import { AppShell } from "@/src/components/ui/app-shell";
import { HeroVisual } from "@/src/components/ui/hero-visual";
import { PrimaryAction } from "@/src/components/ui/primary-action";
import { WorkoutCard } from "@/src/components/ui/workout-card";
import { getWorkoutPageData } from "@/src/server/fitness-queries";

export default async function DashboardPage() {
  await connection();
  const { currentSession, exercises, programs } = await getWorkoutPageData();
  const selectedProgram = programs.find((program) => program.status === "ACTIVE") ?? programs[0] ?? null;
  const selectedProgramStatus =
    selectedProgram?.status === "ACTIVE" ? "Actif" :
    selectedProgram?.status === "DRAFT" ? "Brouillon" :
    selectedProgram?.status === "ARCHIVED" ? "Archive" :
    null;
  const activeExercise = exercises[0] ?? null;
  const currentSetIndex = (currentSession?.sets?.length ?? 0) + 1;
  const currentExerciseIndex = 1;
  const totalExercises = currentSession ? 6 : 0;
  const restSeconds = currentSession?.sets?.[0]?.restSeconds ?? 90;
  const progressPercent = currentSession ? Math.min(100, Math.max(6, Math.round((currentExerciseIndex / Math.max(1, totalExercises)) * 100))) : 0;
  const heroTitle = activeExercise?.nameFr || activeExercise?.name || "Move Today";
  const heroImage = activeExercise?.fallbackImagePath || activeExercise?.fallbackThumbnailPath || "/media/exercises/air-bike/0.jpg";
  const startLabel = "Démarrer";
  const coachLine = currentSession ? "Séance du jour prête." : "Prêt à lancer une séance propre et efficace.";

  return (
    <AppShell className="stack dashboard-premium-screen">
      <HeroVisual title={heroTitle} imageSrc={heroImage} imageAlt={heroTitle} eyebrow="FitAI Pro" className="dashboard-premium-hero">
        <Link href="/workout" prefetch={false} className="dashboard-premium-action">
          <PrimaryAction className="dashboard-premium-cta premium-glow">{startLabel}</PrimaryAction>
        </Link>
      </HeroVisual>

      <WorkoutCard className="dashboard-program-card" light>
        <p className="eyebrow">Programme du jour</p>
        <div className="dashboard-program-main">
          <Image src={heroImage} alt={heroTitle} className="dashboard-program-image" width={320} height={190} />
          <div>
            <h2>{selectedProgram?.name ?? "Aucun programme"}</h2>
            <p>{selectedProgramStatus ? `Statut : ${selectedProgramStatus}` : "Crée ton premier programme dans Plans"}</p>
            <p className="muted">{coachLine}</p>
          </div>
        </div>
      </WorkoutCard>

      {currentSession ? (
        <>
          <section className="dashboard-quick-chips">
            <span className="dashboard-quick-chip">Exercice {`${currentExerciseIndex}/${totalExercises}`}</span>
            <span className="dashboard-quick-chip">Série {currentSetIndex}</span>
            <span className="dashboard-quick-chip">Repos {`${restSeconds}s`}</span>
            <span className="dashboard-quick-chip">Progression {`${progressPercent}%`}</span>
          </section>

          <section className="dashboard-progress-bar-card">
            <div className="dashboard-progress-head">
              <span>Progression séance</span>
              <strong>{progressPercent}%</strong>
            </div>
            <div className="dashboard-progress-track">
              <span style={{ width: `${progressPercent}%` }} />
            </div>
          </section>
        </>
      ) : null}

      {selectedProgram ? (
        <section className="dashboard-mini-stats">
          <span className="chip violet">Programme: {selectedProgram.name}</span>
          <span className={`chip ${selectedProgram?.status === "ACTIVE" ? "success" : selectedProgram?.status === "ARCHIVED" ? "danger" : "warning"}`}>
            Statut: {selectedProgramStatus ?? "Inconnu"}
          </span>
        </section>
      ) : null}
    </AppShell>
  );
}
