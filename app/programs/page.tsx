import { PrimaryButton } from "@/src/components/ui/primary-button";
import { AiProgramGeneratorPanel } from "@/src/components/programs/ai-program-generator-panel";
import { createSimpleProgramAction } from "@/src/server/fitness-actions";
import { getProgramsForDemoUser } from "@/src/server/fitness-queries";

const GOALS = ["HYPERTROPHY", "STRENGTH", "ENDURANCE", "FAT_LOSS", "GENERAL_FITNESS"];
const LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

export default async function ProgramsPage() {
  const programs = await getProgramsForDemoUser();

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
              {GOALS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            <select name="level" className="input">
              {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
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
              <p className="eyebrow">{program.goal} · {program.level}</p>
              <h2 className="section-title">{program.name}</h2>
              <div className="chips">
                <span className="chip">{program.sessionsPerWeek} j/sem</span>
                <span className="chip">Status: {program.status}</span>
                <span className="chip">Jours: {program.days.length}</span>
              </div>
            </section>
          ))
        )}
      </section>
    </div>
  );
}
