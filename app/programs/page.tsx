import { PrimaryButton } from "@/src/components/ui/primary-button";
import { AiProgramGeneratorPanel } from "@/src/components/programs/ai-program-generator-panel";
import { ProgramExercisePicker } from "@/src/components/programs/program-exercise-picker";
import {
  addExerciseToProgramDayAction,
  addProgramDayAction,
  createSimpleProgramAction,
  deleteProgramDayAction,
  renameProgramDayAction,
  resetProgramStructureAction,
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
    getExerciseOptionsForPrograms(360),
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

      <section className="card">
        <p className="eyebrow">Administration</p>
        <form action={resetProgramStructureAction}>
          <PrimaryButton type="submit">Reinitialiser les anciens programmes</PrimaryButton>
        </form>
        <p className="muted">Action destructive: supprime les exercices deja places et remet un jour de base.</p>
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
                <span className="chip">Jours: {program.days.length}</span>
              </div>
              <div className="stack" style={{ marginTop: 16 }}>
                {program.days.map((day) => (
                  <section key={day.id} className="card">
                    <p className="eyebrow">Jour {day.dayIndex}</p>
                    <form action={renameProgramDayAction} className="form-grid">
                      <input type="hidden" name="programId" value={program.id} />
                      <input type="hidden" name="dayId" value={day.id} />

                      <label className="field-label">Nom du jour</label>
                      <input name="title" defaultValue={day.title} className="input" />
                      <label className="field-label">Focus</label>
                      <input name="focus" defaultValue={day.focus || ""} className="input" placeholder="Ex: Haut du corps" />
                      <div className="grid-2">
                        <PrimaryButton type="submit">Enregistrer</PrimaryButton>
                        <button className="ghost-btn" type="submit" formAction={deleteProgramDayAction}>
                          Supprimer
                        </button>
                      </div>
                    </form>

                    {day.exercises.length === 0 ? (
                      <p className="muted">Aucun exercice pour ce jour.</p>
                    ) : (
                      <div className="chips">
                        {day.exercises.map((ex) => (
                          <span key={ex.id} className="chip">
                            {ex.exercise.nameFr || ex.exercise.name} · {ex.sets}x{ex.repsMin ?? "?"}-{ex.repsMax ?? "?"}
                          </span>
                        ))}
                      </div>
                    )}
                  </section>
                ))}

                <form action={addProgramDayAction}>
                  <input type="hidden" name="programId" value={program.id} />
                  <PrimaryButton type="submit">Ajouter un jour</PrimaryButton>
                </form>

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
