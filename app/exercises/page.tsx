import Link from "next/link";
import { ExerciseVisual } from "@/src/components/exercise/exercise-visual";
import { PrimaryButton } from "@/src/components/ui/primary-button";
import { levelToFr } from "@/src/lib/exercise-i18n";
import { getExerciseFilterOptions, getExercisesCatalogPage } from "@/src/server/fitness-queries";

function withQuery(
  page: number,
  search: string,
  muscle: string,
  equipment: string,
) {
  const params = new URLSearchParams();
  if (search) params.set("q", search);
  if (muscle) params.set("muscle", muscle);
  if (equipment) params.set("equipment", equipment);
  params.set("page", String(page));
  return `/exercises?${params.toString()}`;
}

export default async function ExercisesPage(props: PageProps<"/exercises">) {
  const searchParams = await props.searchParams;
  const search = String(searchParams.q ?? "").trim();
  const muscle = String(searchParams.muscle ?? "").trim();
  const equipment = String(searchParams.equipment ?? "").trim();
  const page = Math.max(1, Number(searchParams.page ?? 1) || 1);

  let filters = { muscles: [] as string[], equipment: [] as string[] };
  let result = {
    page,
    pageSize: 24,
    total: 0,
    totalPages: 1,
    exercises: [] as Awaited<ReturnType<typeof getExercisesCatalogPage>>["exercises"],
  };

  try {
    const response = await Promise.all([
      getExerciseFilterOptions(),
      getExercisesCatalogPage({ search, muscle, equipment, page, pageSize: 24 }),
    ]);
    filters = response[0];
    result = response[1];
  } catch (error) {
    console.error("[exercises-page] failed to load exercises catalog", error);
    // Keep page renderable even if DB query fails in production.
  }

  return (
    <div className="stack">
      <section className="hero mini compact">
        <p className="eyebrow">Catalogue premium</p>
        <h1>{result.total} exercices disponibles</h1>
      </section>

      <section className="card">
        <Link href="/workout">
          <PrimaryButton>Demarrer une seance guidee</PrimaryButton>
        </Link>
      </section>

      <section className="stack">
        <section className="card exercises-toolbar">
          <form method="get" className="form-grid">
            <input name="q" defaultValue={search} className="input" placeholder="Rechercher par nom" />
            <select name="muscle" defaultValue={muscle} className="input">
              <option value="">Tous les muscles</option>
              {filters.muscles.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select name="equipment" defaultValue={equipment} className="input">
              <option value="">Tout le materiel</option>
              {filters.equipment.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <PrimaryButton type="submit">Filtrer</PrimaryButton>
          </form>
        </section>

        <section className="exercise-grid">
          {result.exercises.map((exercise) => (
            <article key={exercise.id} className="exercise-card exercise-card-premium">
              <ExerciseVisual
                media={exercise.media as never}
                fallbackImage={exercise.fallbackThumbnailPath || exercise.fallbackImagePath}
                fallbackAnimation={exercise.fallbackAnimationPath}
                title={exercise.nameFr || exercise.name}
                compact
              />
              <div className="exercise-card-overlay">
                <h3>{exercise.nameFr || exercise.name}</h3>
                <p className="muted">{exercise.primaryMusclesFr[0] || exercise.primaryMuscles[0] || "Full body"}</p>
                <div className="chips">
                  <span className="chip">{exercise.equipmentFr[0] || exercise.equipment[0] || "Poids du corps"}</span>
                  <span className="chip">{levelToFr(exercise.difficulty)}</span>
                </div>
              </div>
              <Link href={`/exercises/${exercise.slug}`} className="outline-link">Voir detail</Link>
            </article>
          ))}
        </section>

        {result.exercises.length === 0 && (
          <section className="card">
            <h3 className="section-title">Aucun exercice trouve</h3>
            <p className="muted">Essayez une autre recherche ou retirez un filtre.</p>
            <Link href="/exercises" className="outline-link">Reinitialiser les filtres</Link>
          </section>
        )}

        <section className="card workout-footer">
          <Link
            href={withQuery(Math.max(1, result.page - 1), search, muscle, equipment)}
            className={`ghost-btn ${result.page <= 1 ? "disabled" : ""}`}
            aria-disabled={result.page <= 1}
          >
            Page precedente
          </Link>
          <Link
            href={withQuery(Math.min(result.totalPages, result.page + 1), search, muscle, equipment)}
            className={`primary-button ${result.page >= result.totalPages ? "disabled" : ""}`}
            aria-disabled={result.page >= result.totalPages}
          >
            Page suivante ({result.page}/{result.totalPages})
          </Link>
        </section>
      </section>
    </div>
  );
}
