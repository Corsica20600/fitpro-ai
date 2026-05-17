import { PrimaryButton } from "@/src/components/ui/primary-button";
import { AiProgramGeneratorPanel } from "@/src/components/programs/ai-program-generator-panel";
import { ProgramExercisePicker } from "@/src/components/programs/program-exercise-picker";
import { ExerciseVisual } from "@/src/components/exercise/exercise-visual";
import {
  addExerciseToProgramDayAction,
  createSimpleProgramAction,
  deleteProgramExerciseAction,
  moveProgramExercisePositionAction,
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

          <PrimaryButton type="submit">Creer programme</PrimaryButton>
        </form>
      </section>

      <AiProgramGeneratorPanel />

      <section className="stack">
        {programs.length === 0 ? (
          <section className="card">
            <p className="muted">Aucun programme. Cree ton premier plan.</p>
          </section>
        ) : (
          programs.map((program) => (
            <section key={program.id} className="card">
              <p className="eyebrow">{goalToFr(program.goal)} · {levelToFr(program.level)}</p>
              <h2 className="section-title">{program.name}</h2>
              <div className="chips">
                <span className="chip">Statut: {statusToFr(program.status)}</span>
                <span className="chip">Seance unique</span>
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
                  <button className="ghost-btn" type="submit">Archiver</button>
                </form>
              </div>
              <div className="stack" style={{ marginTop: 16 }}>
                {program.days.map((day) => (
                  <details key={day.id} className="card">
                    <summary className="day-summary">
                      <span>{day.title || program.name}</span>
                      <span className="chip">{day.exercises.length} exos</span>
                    </summary>
                    <p className="eyebrow">Seance du programme</p>
                    <form action={renameProgramDayAction} className="form-grid">
                      <input type="hidden" name="programId" value={program.id} />
                      <input type="hidden" name="dayId" value={day.id} />

                      <label className="field-label">Nom de la seance</label>
                      <input name="title" defaultValue={day.title} className="input" />
                      <label className="field-label">Focus</label>
                      <input name="focus" defaultValue={day.focus || ""} className="input" placeholder="Ex: Haut du corps" />
                      <PrimaryButton type="submit">Enregistrer</PrimaryButton>
                    </form>

                    {day.exercises.length === 0 ? (
                      <p className="muted">Aucun exercice pour ce jour.</p>
                    ) : (
                      <div className="program-day-list">
                        {day.exercises.map((ex, idx) => (
                          <article key={ex.id} className="program-day-item">
                            <ExerciseVisual
                              media={
                                ex.exercise.media?.map((m) => ({
                                  type: m.type,
                                  publicUrl: m.publicUrl,
                                  url: m.url,
                                  format: String(m.format || "").toLowerCase(),
                                })) ?? []
                              }
                              fallbackImage={ex.exercise.fallbackThumbnailPath || ex.exercise.fallbackImagePath}
                              fallbackAnimation={ex.exercise.primaryAnimationPath}
                              title={ex.exercise.nameFr || ex.exercise.name}
                              compact
                              className="program-day-item-visual"
                            />
                            <div>
                              <p className="program-day-item-title">{ex.exercise.nameFr || ex.exercise.name}</p>
                              <p className="muted">
                                {ex.sets} series · {ex.repsMin ?? "?"} reps · {ex.restSeconds ?? "?"} sec · {ex.repsText || "Poids libre"}
                              </p>
                              <form action={updateProgramExerciseAction} className="form-grid" style={{ marginTop: 8 }}>
                                <input type="hidden" name="programId" value={program.id} />
                                <input type="hidden" name="programExerciseId" value={ex.id} />
                                <div className="grid-2">
                                  <div>
                                    <label className="field-label">Series</label>
                                    <input name="sets" type="number" defaultValue={ex.sets} className="input" />
                                  </div>
                                  <div>
                                    <label className="field-label">Repetitions</label>
                                    <input name="repetitions" type="number" defaultValue={ex.repsMin ?? 10} className="input" />
                                  </div>
                                </div>
                                <div className="grid-2">
                                  <div>
                                    <label className="field-label">Repos (sec)</label>
                                    <input name="restSeconds" type="number" defaultValue={ex.restSeconds ?? 60} className="input" />
                                  </div>
                                  <div>
                                    <label className="field-label">Poids (kg)</label>
                                    <input name="targetWeightKg" type="number" defaultValue={Number(ex.repsText?.replace(/[^\d.,]/g, "").replace(",", ".") || 0)} className="input" />
                                  </div>
                                </div>
                                <div className="grid-2">
                                  <PrimaryButton type="submit">Modifier</PrimaryButton>
                                  <button className="ghost-btn" type="submit" formAction={deleteProgramExerciseAction}>Retirer</button>
                                </div>
                              </form>
                              <div className="grid-2" style={{ marginTop: 8 }}>
                                <form action={moveProgramExercisePositionAction}>
                                  <input type="hidden" name="programId" value={program.id} />
                                  <input type="hidden" name="programExerciseId" value={ex.id} />
                                  <input type="hidden" name="direction" value="up" />
                                  <button className="ghost-btn" type="submit" disabled={idx === 0}>Monter</button>
                                </form>
                                <form action={moveProgramExercisePositionAction}>
                                  <input type="hidden" name="programId" value={program.id} />
                                  <input type="hidden" name="programExerciseId" value={ex.id} />
                                  <input type="hidden" name="direction" value="down" />
                                  <button className="ghost-btn" type="submit" disabled={idx === day.exercises.length - 1}>Descendre</button>
                                </form>
                              </div>
                              <form action={replaceProgramExerciseAction} className="form-grid" style={{ marginTop: 8 }}>
                                <input type="hidden" name="programId" value={program.id} />
                                <input type="hidden" name="programExerciseId" value={ex.id} />
                                <label className="field-label">Remplacer par</label>
                                <select name="exerciseId" className="input" defaultValue={ex.exerciseId}>
                                  {exerciseOptions.map((opt) => (
                                    <option key={opt.id} value={opt.id}>
                                      {(opt.nameFr || opt.name)} · {(opt.primaryMusclesFr[0] || opt.primaryMuscles[0] || "Full body")}
                                    </option>
                                  ))}
                                </select>
                                <PrimaryButton type="submit">Remplacer l&apos;exercice</PrimaryButton>
                              </form>
                            </div>
                          </article>
                        ))}
                      </div>
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
