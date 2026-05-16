import { startWorkoutSessionAction } from "@/src/server/fitness-actions";
import { getWorkoutPageData } from "@/src/server/fitness-queries";
import { AppShell } from "@/src/components/ui/app-shell";
import { HeroVisual } from "@/src/components/ui/hero-visual";
import { PrimaryAction } from "@/src/components/ui/primary-action";
import { WorkoutCard } from "@/src/components/ui/workout-card";
import { GuidedWorkoutClient } from "@/src/components/workout/guided-workout-client";

export default async function WorkoutPage() {
  const { programs, sessionExercises, currentSession } = await getWorkoutPageData();
  const heroExercise = sessionExercises[0] ?? null;
  const heroTitle = currentSession
    ? (heroExercise?.nameFr || heroExercise?.name || currentSession.title || "Seance du jour")
    : "Seance guidee";
  const heroImage = heroExercise?.fallbackImagePath || heroExercise?.fallbackThumbnailPath || "/media/exercises/air-bike/0.jpg";

  return (
    <AppShell className="stack workout-screen premium-workout">
      <HeroVisual
        title={heroTitle}
        eyebrow="Seance guidee"
        imageSrc={heroImage}
        imageAlt={heroTitle}
        className="workout-page-hero"
      />

      {!currentSession ? (
        <WorkoutCard light>
          <h2 className="section-title">Demarrer une seance</h2>
          <form action={startWorkoutSessionAction} className="form-grid">
            <input name="title" className="input" placeholder="Nom de seance optionnel" />
            <select name="programId" className="input" defaultValue="">
              <option value="">Sans programme</option>
              {programs.map((program) => (
                <option key={program.id} value={program.id}>{program.name}</option>
              ))}
            </select>
            <PrimaryAction type="submit">Demarrer</PrimaryAction>
          </form>
        </WorkoutCard>
      ) : sessionExercises.length === 0 ? (
        <WorkoutCard light>
          <h2 className="section-title">Aucun exercice disponible</h2>
          <p className="muted">Importez d&apos;abord des exercices pour lancer une seance guidee.</p>
        </WorkoutCard>
      ) : (
        <GuidedWorkoutClient
          sessionId={currentSession.id}
          exercises={sessionExercises.map((item) => ({
            id: item.id,
            slug: item.slug,
            name: item.name,
            nameFr: item.nameFr,
            primaryMuscles: item.primaryMuscles,
            primaryMusclesFr: item.primaryMusclesFr,
            equipment: item.equipment,
            equipmentFr: item.equipmentFr,
            difficulty: item.difficulty,
            fallbackImagePath: item.fallbackImagePath,
            fallbackThumbnailPath: item.fallbackThumbnailPath,
            fallbackAnimationPath: item.fallbackAnimationPath,
            plannedSets: item.plan?.sets ?? null,
            plannedRepsMin: item.plan?.repsMin ?? null,
            plannedRepsMax: item.plan?.repsMax ?? null,
            plannedWeightKg: item.plan?.plannedWeightKg ?? null,
            plannedRestSeconds: item.plan?.restSeconds ?? null,
            programExerciseId: item.plan?.programExerciseId ?? null,
            media: item.media.map((media) => ({
              id: media.id,
              type: media.type,
              publicUrl: media.publicUrl,
              url: media.url,
              format: media.format,
            })),
          }))}
          existingSets={currentSession.sets.map((set) => ({
            id: set.id,
            exerciseId: set.exerciseId,
            setIndex: set.setIndex,
            targetRepsMin: set.targetRepsMin,
            actualReps: set.actualReps,
            actualWeightKg: set.actualWeightKg,
            createdAt: set.createdAt.toISOString(),
          }))}
        />
      )}
    </AppShell>
  );
}
