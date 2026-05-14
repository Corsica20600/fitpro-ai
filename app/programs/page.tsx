import { PrimaryButton } from "@/src/components/ui/primary-button";
import { AiProgramGeneratorPanel } from "@/src/components/programs/ai-program-generator-panel";
import { addExerciseToProgramDayAction, createSimpleProgramAction } from "@/src/server/fitness-actions";
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
          <input name="name" placeholder="Nom du programme" className="input" required />
          <div className="grid-2">
            <select name="goal" className="input">
              {GOALS.map((g) => <option key={g} value={g}>{goalToFr(g)}</option>)}
            </select>
            <select name="level" className="input">
              {LEVELS.map((l) => <option key={l} value={l}>{levelToFr(l as "BEGINNER" | "INTERMEDIATE" | "ADVANCED")}</option>)}
            </select>
          </div>
          <input name="sessionsPerWeek" type="number" min={2} max={6} defaultValue={4} className="input" />
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
                <span className="chip">{program.sessionsPerWeek} j/sem</span>
                <span className="chip">Statut: {statusToFr(program.status)}</span>
                <span className="chip">Jours: {program.days.length}</span>
              </div>
              <div className="stack" style={{ marginTop: 16 }}>
                {program.days.map((day) => (
                  <section key={day.id} className="card">
                    <p className="eyebrow">Jour {day.dayIndex}</p>
                    <h3 className="section-title">{day.title}</h3>
                    <p className="muted">{day.focus || "Focus libre"}</p>
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
                <section className="card">
                  <p className="eyebrow">Ajouter un exercice</p>
                  <form action={addExerciseToProgramDayAction} className="form-grid">
                    <input type="hidden" name="programId" value={program.id} />
                    <select name="dayId" className="input" defaultValue={program.days[0]?.id}>
                      {program.days.map((day) => (
                        <option key={day.id} value={day.id}>
                          Jour {day.dayIndex} · {day.title}
                        </option>
                      ))}
                    </select>
                    <select name="exerciseId" className="input" required>
                      {exerciseOptions.map((exercise) => (
                        <option key={exercise.id} value={exercise.id}>
                          {(exercise.nameFr || exercise.name)} · {(exercise.primaryMusclesFr[0] || exercise.primaryMuscles[0] || "Full body")}
                        </option>
                      ))}
                    </select>
                    <div className="grid-2">
                      <input name="sets" type="number" min={1} max={12} defaultValue={4} className="input" />
                      <input name="restSeconds" type="number" min={15} max={300} defaultValue={90} className="input" />
                    </div>
                    <div className="grid-2">
                      <input name="repsMin" type="number" min={1} max={40} defaultValue={8} className="input" />
                      <input name="repsMax" type="number" min={1} max={60} defaultValue={12} className="input" />
                    </div>
                    <PrimaryButton type="submit">Ajouter au programme</PrimaryButton>
                  </form>
                </section>
              </div>
            </section>
          ))
        )}
      </section>
    </div>
  );
}
