import { connection } from "next/server";
import { ActiveProgramCard } from "@/src/components/programs/active-program-card";
import { PrimaryButton } from "@/src/components/ui/primary-button";
import { AiProgramGeneratorPanel } from "@/src/components/programs/ai-program-generator-panel";
import { EmptyState } from "@/src/components/ui/empty-state";
import { GlassCard } from "@/src/components/ui/glass-card";
import { PageHeader } from "@/src/components/ui/page-header";
import { ProgramCard } from "@/src/components/programs/program-card";
import { ProgramExercisePicker } from "@/src/components/programs/program-exercise-picker";
import { ProgramDayExercisesEditor } from "@/src/components/programs/program-day-exercises-editor";
import { ProgramSummary } from "@/src/components/programs/program-summary";
import {
  addExerciseToProgramDayAction,
  createSimpleProgramAction,
  deleteProgramExerciseAction,
  replaceProgramExerciseAction,
  renameProgramDayAction,
  setProgramStatusAction,
  updateProgramExerciseAction,
} from "@/src/server/fitness-actions";
import { getExerciseOptionsForPrograms, getProgramsForDemoUser } from "@/src/server/fitness-queries";
import { levelToFr } from "@/src/lib/exercise-i18n";
import { privatePageMetadata } from "@/src/lib/private-page-metadata";

const GOALS = ["HYPERTROPHY", "STRENGTH", "ENDURANCE", "FAT_LOSS", "GENERAL_FITNESS"];
const LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

export const metadata = privatePageMetadata(
  "Programmes",
  "Programmes privés Traknio, génération, édition et organisation des séances.",
);

function goalToFr(goal: string) {
  const map: Record<string, string> = {
    HYPERTROPHY: "Prise de muscle",
    STRENGTH: "Force",
    ENDURANCE: "Endurance",
    FAT_LOSS: "Perte de gras",
    GENERAL_FITNESS: "Remise en forme",
  };
  return map[goal] ?? goal;
}

function statusToFr(status: string) {
  const map: Record<string, string> = {
    DRAFT: "Brouillon",
    ACTIVE: "Actif",
    ARCHIVED: "Archive",
  };
  return map[status] ?? status;
}

function uniqueProgramMuscles(program: Awaited<ReturnType<typeof getProgramsForDemoUser>>[number]) {
  return [...new Set(program.days.flatMap((day) =>
    day.exercises.map((item) => item.exercise.primaryMusclesFr[0] || item.exercise.primaryMuscles[0]).filter(Boolean),
  ))].slice(0, 5);
}

function uniqueProgramEquipment(program: Awaited<ReturnType<typeof getProgramsForDemoUser>>[number]) {
  return [...new Set(program.days.flatMap((day) =>
    day.exercises.map((item) => item.exercise.equipmentFr[0] || item.exercise.equipment[0]).filter(Boolean),
  ))].slice(0, 4);
}

function programExercisesCount(program: Awaited<ReturnType<typeof getProgramsForDemoUser>>[number]) {
  return program.days.reduce((acc, day) => acc + day.exercises.length, 0);
}

export default async function ProgramsPage() {
  await connection();
  const [programs, exerciseOptions] = await Promise.all([
    getProgramsForDemoUser(),
    getExerciseOptionsForPrograms(2000),
  ]);
  const activeProgram = programs.find((program) => program.status === "ACTIVE") ?? null;
  const totalDays = programs.reduce((acc, program) => acc + program.days.length, 0);
  const totalProgramExercises = programs.reduce((acc, program) => acc + programExercisesCount(program), 0);

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Tes entraînements"
        title="Programmes"
        description={`Choisis une structure d'entraînement adaptée à ton rythme. ${programs.length} programme${programs.length > 1 ? "s" : ""} disponible${programs.length > 1 ? "s" : ""}.`}
      />

      <ActiveProgramCard
        program={activeProgram}
        totalExercises={activeProgram ? programExercisesCount(activeProgram) : 0}
        nextSessionTitle={activeProgram?.days[0]?.title ?? null}
      />

      <GlassCard>
        <p className="eyebrow">Nouveau programme</p>
        <form action={createSimpleProgramAction} className="form-grid">
          <label className="field-label" htmlFor="program-name">Nom du programme</label>
          <input id="program-name" name="name" placeholder="Nom du programme" className="input" required />

          <label className="field-label">Objectif</label>
          <div className="grid-2">
            <select name="goal" className="input">
              {GOALS.map((g) => <option key={g} value={g}>{goalToFr(g)}</option>)}
            </select>
            <select name="level" className="input">
              {LEVELS.map((l) => <option key={l} value={l}>{levelToFr(l as "BEGINNER" | "INTERMEDIATE" | "ADVANCED")}</option>)}
            </select>
          </div>

          <PrimaryButton type="submit">Créer programme</PrimaryButton>
        </form>
      </GlassCard>

      <AiProgramGeneratorPanel />

      <ProgramSummary
        totalPrograms={programs.length}
        activeCount={programs.filter((program) => program.status === "ACTIVE").length}
        totalDays={totalDays}
        totalExercises={totalProgramExercises}
      />

      <section className="stack">
        {programs.length === 0 ? (
          <EmptyState
            title="Aucun programme"
            description="Crée ton premier plan ou génère une base avec l'IA pour démarrer proprement."
          />
        ) : (
          programs.map((program) => (
            <ProgramCard
              key={program.id}
              id={program.id}
              name={program.name}
              description={program.description}
              goalLabel={goalToFr(program.goal)}
              level={program.level}
              status={program.status}
              statusLabel={statusToFr(program.status)}
              sessionsCount={program.days.length}
              exercisesCount={programExercisesCount(program)}
              muscles={uniqueProgramMuscles(program)}
              equipment={uniqueProgramEquipment(program)}
              actions={
                <div className="grid-2">
                  <form action={setProgramStatusAction}>
                    <input type="hidden" name="programId" value={program.id} />
                    <input type="hidden" name="status" value={program.status === "ACTIVE" ? "DRAFT" : "ACTIVE"} />
                    <PrimaryButton type="submit">
                      {program.status === "ACTIVE" ? "Passer en brouillon" : "Activer le programme"}
                    </PrimaryButton>
                  </form>
                  <form action={setProgramStatusAction}>
                    <input type="hidden" name="programId" value={program.id} />
                    <input type="hidden" name="status" value="ARCHIVED" />
                    <button className="ghost-btn chip danger" type="submit">Archiver</button>
                  </form>
                </div>
              }
            >
              <div className="stack" style={{ marginTop: 16 }}>
                {program.days.map((day) => (
                  <details key={day.id} className="program-day-panel">
                    <summary className="day-summary">
                      <span>{day.title || program.name}</span>
                      <span className="chip orange">{day.exercises.length} exos</span>
                    </summary>
                    <p className="eyebrow">Séance du programme</p>
                    <form action={renameProgramDayAction} className="form-grid">
                      <input type="hidden" name="programId" value={program.id} />
                      <input type="hidden" name="dayId" value={day.id} />

                      <label className="field-label">Nom de la séance</label>
                      <input name="title" defaultValue={day.title} className="input" />
                      <label className="field-label">Focus</label>
                      <input name="focus" defaultValue={day.focus || ""} className="input" placeholder="Ex: Haut du corps" />
                      <PrimaryButton type="submit">Enregistrer</PrimaryButton>
                    </form>

                    {day.exercises.length === 0 ? (
                      <p className="muted">Aucun exercice pour ce jour.</p>
                    ) : (
                      <ProgramDayExercisesEditor
                        programId={program.id}
                        initialExercises={day.exercises.map((ex) => ({
                          id: ex.id,
                          exerciseId: ex.exerciseId,
                          sets: ex.sets,
                          repsMin: ex.repsMin,
                          repsText: ex.repsText,
                          restSeconds: ex.restSeconds,
                          exercise: {
                            id: ex.exercise.id,
                            name: ex.exercise.name,
                            nameFr: ex.exercise.nameFr,
                            fallbackThumbnailPath: ex.exercise.fallbackThumbnailPath,
                            fallbackImagePath: ex.exercise.fallbackImagePath,
                            primaryAnimationPath: ex.exercise.primaryAnimationPath,
                            media: ex.exercise.media?.map((m) => ({
                              type: m.type,
                              publicUrl: m.publicUrl,
                              url: m.url,
                              format: String(m.format || "").toLowerCase(),
                            })) ?? [],
                          },
                        }))}
                        exerciseOptions={exerciseOptions.map((opt) => ({
                          id: opt.id,
                          name: opt.name,
                          nameFr: opt.nameFr,
                          primaryMuscles: opt.primaryMuscles,
                          primaryMusclesFr: opt.primaryMusclesFr,
                        }))}
                        updateAction={updateProgramExerciseAction}
                        deleteAction={deleteProgramExerciseAction}
                        replaceAction={replaceProgramExerciseAction}
                      />
                    )}
                  </details>
                ))}

                <details className="program-day-panel">
                  <summary className="day-summary">
                    <span>Ajouter un exercice</span>
                    <span className="chip violet">Ouvrir</span>
                  </summary>
                  <ProgramExercisePicker
                    programId={program.id}
                    days={program.days.map((day) => ({ id: day.id, dayIndex: day.dayIndex, title: day.title }))}
                    exercises={exerciseOptions}
                    action={addExerciseToProgramDayAction}
                  />
                </details>
              </div>
            </ProgramCard>
          ))
        )}
      </section>
    </div>
  );
}
