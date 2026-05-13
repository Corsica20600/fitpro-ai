import Link from "next/link";
import { notFound } from "next/navigation";
import { ExerciseVisual } from "@/src/components/exercise/exercise-visual";
import { PrimaryButton } from "@/src/components/ui/primary-button";
import { categoryToFr, levelToFr } from "@/src/lib/exercise-i18n";
import { getExerciseBySlug } from "@/src/server/fitness-queries";

export default async function ExerciseDetailPage(props: PageProps<"/exercises/[slug]">) {
  const { slug } = await props.params;
  const exercise = await getExerciseBySlug(slug);

  if (!exercise) notFound();

  const primaryMuscles = exercise.primaryMusclesFr.length ? exercise.primaryMusclesFr : exercise.primaryMuscles;
  const secondaryMuscles = exercise.secondaryMuscles;
  const equipment = exercise.equipmentFr.length ? exercise.equipmentFr : exercise.equipment;
  const instructions = exercise.instructionsFr || exercise.detailedInstructions;
  const commonMistakes = exercise.commonMistakesFr.length ? exercise.commonMistakesFr : exercise.commonMistakes;

  const sourceName = exercise.media.find((item) => item.sourceName)?.sourceName;
  const license = exercise.media.find((item) => item.license)?.license;

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
        <Link href="/workout">
          <PrimaryButton>Ajouter a une seance</PrimaryButton>
        </Link>
        <Link href="/exercises" className="outline-link">Retour catalogue</Link>
      </section>
    </div>
  );
}
