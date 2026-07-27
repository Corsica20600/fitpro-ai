import { connection } from "next/server";
import { startWorkoutSessionAction } from "@/src/server/fitness-actions";
import { getWorkoutPageData } from "@/src/server/fitness-queries";
import { AppShell } from "@/src/components/ui/app-shell";
import { HeroVisual } from "@/src/components/ui/hero-visual";
import { PrimaryAction } from "@/src/components/ui/primary-action";
import { WorkoutCard } from "@/src/components/ui/workout-card";
import { GuidedWorkoutClient } from "@/src/components/workout/guided-workout-client";
import { AppShortcutLink } from "@/src/components/integrations/app-shortcut-link";
import { getExerciseOverride } from "@/src/lib/exercise-overrides";
import { spotifyIntegration } from "@/src/lib/integrations";

function formatWorkoutLabel(label?: string | null) {
  if (!label) return null;
  const normalized = label.trim().toLowerCase();
  const map: Record<string, string> = {
    "full body": "Corps complet",
    "upper body": "Haut du corps",
    "lower body": "Bas du corps",
    push: "Poussée",
    pull: "Tirage",
    legs: "Jambes",
  };

  return map[normalized] ?? label;
}

export default async function WorkoutPage() {
  await connection();
  const { programs, sessionExercises, currentSession, lastPerformedProgramId } = await getWorkoutPageData();
  const heroExercise = sessionExercises[0] ?? null;
  const defaultProgramId = programs.some((program) => program.id === lastPerformedProgramId)
    ? lastPerformedProgramId
    : (programs.find((program) => program.status === "ACTIVE")?.id ?? "");
  const heroTitle = currentSession
    ? (formatWorkoutLabel(currentSession.title) || "Séance du jour")
    : "Séance guidée";
  const heroImage = heroExercise?.fallbackImagePath || heroExercise?.fallbackThumbnailPath || "/media/exercises/air-bike/0.jpg";

  return (
    <AppShell className="stack workout-screen premium-workout">
      {!currentSession ? (
        <HeroVisual
          title={heroTitle}
          eyebrow="Seance guidee"
          imageSrc={heroImage}
          imageAlt={heroTitle}
          className="workout-page-hero"
        />
      ) : null}

      {!currentSession ? (
        <WorkoutCard light>
          <h2 className="section-title">Démarrer une séance</h2>
          <form action={startWorkoutSessionAction} className="form-grid">
            <select name="programId" className="input" defaultValue={defaultProgramId ?? ""}>
              <option value="">Sans programme</option>
              {programs.map((program) => (
                <option key={program.id} value={program.id}>{formatWorkoutLabel(program.name) || program.name}</option>
              ))}
            </select>
            <PrimaryAction type="submit" className="premium-glow">Démarrer</PrimaryAction>
          </form>
          <div className="stack" style={{ marginTop: 10 }}>
            <span className="chip warning">Conseil : lance ta playlist avant la première série.</span>
            <AppShortcutLink
              label={`Ouvrir ${spotifyIntegration.appName}`}
              deepLinkUrl={spotifyIntegration.deepLinkUrl}
              fallbackWebUrl={spotifyIntegration.fallbackWebUrl}
              className="ghost-btn"
            />
          </div>
        </WorkoutCard>
      ) : sessionExercises.length === 0 ? (
        <WorkoutCard light>
          <h2 className="section-title">Aucun exercice disponible</h2>
          <p className="muted">Importe d&apos;abord des exercices pour lancer une séance guidée.</p>
          <span className="chip danger">Action requise: ajoute au moins un exercice</span>
          <AppShortcutLink
            label={`Ouvrir ${spotifyIntegration.appName}`}
            deepLinkUrl={spotifyIntegration.deepLinkUrl}
            fallbackWebUrl={spotifyIntegration.fallbackWebUrl}
            className="ghost-btn"
          />
        </WorkoutCard>
      ) : (
        <>
          <WorkoutCard light>
            <p className="eyebrow">Focus musique</p>
            <span className="chip orange">Mode focus actif</span>
            <p className="muted">Garde le tempo, contrôle la descente.</p>
            <AppShortcutLink
              label={`Ouvrir ${spotifyIntegration.appName}`}
              deepLinkUrl={spotifyIntegration.deepLinkUrl}
              fallbackWebUrl={spotifyIntegration.fallbackWebUrl}
              className="ghost-btn"
            />
          </WorkoutCard>
          <GuidedWorkoutClient
            sessionId={currentSession.id}
            sessionTitle={formatWorkoutLabel(currentSession.title) || heroTitle}
            programName={formatWorkoutLabel(currentSession.program?.name)}
            startedAt={(currentSession.startedAt ?? currentSession.createdAt).toISOString()}
            exercises={sessionExercises.map((item) => {
              const displayName = getExerciseOverride(item.slug)?.displayNameFr || item.nameFr || item.name;

              return {
                id: item.id,
                slug: item.slug,
                name: displayName,
                nameFr: displayName,
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
                technicalCue: item.shortTechnicalCues[0] ?? null,
                media: item.media.map((media) => ({
                  id: media.id,
                  type: media.type,
                  publicUrl: media.publicUrl,
                  url: media.url,
                  format: media.format,
                })),
              };
            })}
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
        </>
      )}
    </AppShell>
  );
}
