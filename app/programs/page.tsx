import { connection } from "next/server";
import { PrimaryButton } from "@/src/components/ui/primary-button";
import { AiProgramGeneratorPanel } from "@/src/components/programs/ai-program-generator-panel";
import { ProgramExercisePicker } from "@/src/components/programs/program-exercise-picker";
import { ProgramDayExercisesEditor } from "@/src/components/programs/program-day-exercises-editor";
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

const GOALS = ["HYPERTROPHY", "STRENGTH", "ENDURANCE", "FAT_LOSS", "GENERAL_FITNESS"];
const LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

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

export default async function ProgramsPage() {
  await connection();
  const [programs, exerciseOptions] = await Promise.all([
    getProgramsForDemoUser(),
    getExerciseOptionsForPrograms(2000),
  ]);

  return (
    <div className="stack">
      <section className="hero mini compact">
        <p className="eyebrow">Programmes</p>
        <h1>Construit ton plan en 10 secondes</h1>
      </section>

      <section className="card">
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
      </section>

      <AiProgramGeneratorPanel />

      <section className="stack">
        {programs.length === 0 ? (
          <section className="card">
            <p className="muted">Aucun programme. Crée ton premier plan.</p>
          </section>
        ) : (
          programs.map((program) => (
            <section key={program.id} className="card">
              <p className="eyebrow">{goalToFr(program.goal)} · {levelToFr(program.level)}</p>
              <h2 className="section-title">{program.name}</h2>
              <div className="chips">
                <span className={`chip ${program.status === "ACTIVE" ? "success" : program.status === "ARCHIVED" ? "danger" : "warning"}`}>
                  Statut : {statusToFr(program.status)}
                </span>
                <span className="chip violet">Séance unique</span>
              </div>
              <div className="grid-2" style={{ marginTop: 10 }}>
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
              <div className="stack" style={{ marginTop: 16 }}>
                {program.days.map((day) => (
                  <details key={day.id} className="card">
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

                <ProgramExercisePicker
                  programId={program.id}
                  days={program.days.map((day) => ({ id: day.id, dayIndex: day.dayIndex, title: day.title }))}
                  exercises={exerciseOptions}
                  action={addExerciseToProgramDayAction}
                />
              </div>
            </section>
          ))
        )}
      </section>
    </div>
  );
}
