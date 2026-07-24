import Link from "next/link";
import { ExerciseVisual } from "@/src/components/exercise/exercise-visual";
import { getExerciseOverride } from "@/src/lib/exercise-overrides";
import { levelToFr } from "@/src/lib/exercise-i18n";

type ExerciseCardProps = {
  exercise: {
    id: string;
    slug: string;
    name: string;
    nameFr: string | null;
    primaryMuscles: string[];
    primaryMusclesFr: string[];
    equipment: string[];
    equipmentFr: string[];
    difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
    fallbackImagePath: string;
    fallbackThumbnailPath: string;
    fallbackAnimationPath: string | null;
    media: Array<{
      type: "IMAGE" | "THUMBNAIL" | "ANIMATION";
      publicUrl?: string | null;
      url?: string | null;
      format?: string | null;
    }>;
  };
};

function hasMotionMedia(exercise: ExerciseCardProps["exercise"]) {
  return Boolean(exercise.fallbackAnimationPath || exercise.media.some((item) => item.type === "ANIMATION"));
}

export function ExerciseCard({ exercise }: ExerciseCardProps) {
  const override = getExerciseOverride(exercise.slug);
  const title = override?.displayNameFr || exercise.nameFr || exercise.name;
  const primaryMuscle = exercise.primaryMusclesFr[0] || exercise.primaryMuscles[0] || "Full body";
  const equipment = exercise.equipmentFr[0] || exercise.equipment[0] || "Poids du corps";
  const hasAnimation = hasMotionMedia(exercise) || Boolean(override?.frameAnimationUrls?.length);

  return (
    <Link
      href={`/exercises/${exercise.slug}`}
      className="exercise-card exercise-card-premium exercise-card-link"
      aria-label={`Voir le détail de ${title}`}
    >
      <ExerciseVisual
        media={exercise.media}
        fallbackImage={override?.cardImage || exercise.fallbackThumbnailPath || exercise.fallbackImagePath}
        fallbackAnimation={exercise.fallbackAnimationPath}
        frameAnimationUrls={override?.frameAnimationUrls}
        frameIntervalMs={override?.frameIntervalMs ?? 700}
        preferFallbackImage={Boolean(override?.cardImage)}
        title={title}
        compact
      />
      <div className="exercise-card-overlay">
        <div className="exercise-card-kicker">
          <span>{primaryMuscle}</span>
          <span>{hasAnimation ? "Media animé" : "Image"}</span>
        </div>
        <h3 className="exercise-card-title">{title}</h3>
        <div className="chips" aria-label="Informations de l'exercice">
          <span className="chip">{equipment}</span>
          <span className="chip">{levelToFr(exercise.difficulty)}</span>
        </div>
        <span className="outline-link exercise-card-cta">Voir le détail</span>
      </div>
    </Link>
  );
}
