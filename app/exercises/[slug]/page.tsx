import Link from "next/link";
import { notFound } from "next/navigation";
import { ExerciseVisual } from "@/src/components/exercise/exercise-visual";
import { PrimaryButton } from "@/src/components/ui/primary-button";
import { categoryToFr, levelToFr } from "@/src/lib/exercise-i18n";
import { addExerciseToProgramDayAction } from "@/src/server/fitness-actions";
import { getExerciseBySlug, getProgramsForDemoUser } from "@/src/server/fitness-queries";
import { looksEnglish, translateSentence, translateSimple } from "@/src/lib/exercise-i18n";

export default async function ExerciseDetailPage(props: PageProps<"/exercises/[slug]">) {
  const { slug } = await props.params;
  const [exercise, programs] = await Promise.all([
    getExerciseBySlug(slug),
    getProgramsForDemoUser(),
  ]);

  if (!exercise) notFound();

  const primaryMuscles = exercise.primaryMusclesFr.length ? exercise.primaryMusclesFr : exercise.primaryMuscles;
  const secondaryMuscles = exercise.secondaryMuscles.map((item) => translateSimple(item).text);
  const equipment = exercise.equipmentFr.length ? exercise.equipmentFr : exercise.equipment;
  const instructions = exercise.instructionsFr && !looksEnglish(exercise.instructionsFr)
    ? exercise.instructionsFr
    : translateSentence(exercise.detailedInstructions).text;
  const commonMistakes = (exercise.commonMistakesFr.length ? exercise.commonMistakesFr : exercise.commonMistakes)
    .map((item) => (looksEnglish(item) ? translateSentence(item).text : item));

  const sourceName = exercise.media.find((item) => item.sourceName)?.sourceName;
  const license = exercise.media.find((item) => item.license)?.license;
  const firstProgram = programs[0] ?? null;
  const firstDay = firstProgram?.days[0] ?? null;

  return (
    <div className="stack exercise-detail-screen">
      <section className="card">
        <ExerciseVisual
          media={exercise.media as never}
          fallbackAnimation={exercise.fallbackAnimationPath}
          fallbackImage={exercise.fallbackImagePath}
          title={exercise.nameFr || exercise.name}
        />
        <div className="exercise-header-text">
          <p className="eyebrow">{categoryToFr(exercise.category)} · {levelToFr(exercise.difficulty)}</p>
          <h1>{exercise.nameFr || exercise.name}</h1>
          <p className="muted">{primaryMuscles.join(" · ") || "Full body"}</p>
        </div>
      </section>

      <section className="card details-grid">
        <div>
          <h3>Muscles principaux</h3>
          <p>{primaryMuscles.join(" · ") || "Full body"}</p>
        </div>
        <div>
          <h3>Muscles secondaires</h3>
          <p>{secondaryMuscles.join(" · ") || "Aucun"}</p>
        </div>
        <div>
          <h3>Materiel</h3>
          <p>{equipment.join(" · ") || "Poids du corps"}</p>
        </div>
        <div>
          <h3>Niveau</h3>
          <p>{levelToFr(exercise.difficulty)}</p>
        </div>
        <div>
          <h3>Instructions</h3>
          <p>{instructions}</p>
        </div>
      </section>

      {commonMistakes.length > 0 && (
        <section className="card">
          <h3>Erreurs frequentes</h3>
          <ul className="detail-list">
            {commonMistakes.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>
      )}

      {(sourceName || license) && (
        <section className="card">
          <p className="muted">
            Source: {sourceName || "N/A"}{license ? ` · Licence: ${license}` : ""}
          </p>
        </section>
      )}

      <section className="card action-stack">
        {programs.length === 0 || !firstProgram || !firstDay ? (
          <div className="stack">
            <p className="muted">Cree d'abord un programme pour ajouter cet exercice.</p>
            <Link href="/programs">
              <PrimaryButton>Creer un programme</PrimaryButton>
            </Link>
          </div>
        ) : (
          <form action={addExerciseToProgramDayAction} className="form-grid">
            <input type="hidden" name="exerciseId" value={exercise.id} />
            <label className="field-label">Programme</label>
            <select name="programId" className="input" defaultValue={firstProgram.id}>
              {programs.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.name}
                </option>
              ))}
            </select>

            <label className="field-label">Jour du programme</label>
            <select name="dayId" className="input" defaultValue={firstDay.id}>
              {programs.flatMap((program) =>
                program.days.map((day) => (
                  <option key={day.id} value={day.id}>
                    {program.name} · Jour {day.dayIndex} · {day.title}
                  </option>
                )),
              )}
            </select>

            <div className="grid-2">
              <div>
                <label className="field-label">Series</label>
                <input className="input" type="number" name="sets" min={1} max={12} defaultValue={3} />
              </div>
              <div>
                <label className="field-label">Repetitions</label>
                <input className="input" type="number" name="repetitions" min={1} max={60} defaultValue={10} />
              </div>
            </div>
            <div className="grid-2">
              <div>
                <label className="field-label">Repos (sec)</label>
                <input className="input" type="number" name="restSeconds" min={15} max={300} defaultValue={45} />
              </div>
              <div>
                <label className="field-label">Poids (kg)</label>
                <input className="input" type="number" name="targetWeightKg" min={0} max={300} defaultValue={0} />
              </div>
            </div>
            <PrimaryButton>Ajouter au programme</PrimaryButton>
          </form>
        )}
        <Link href="/exercises" className="outline-link">Retour catalogue</Link>
      </section>
    </div>
  );
}
