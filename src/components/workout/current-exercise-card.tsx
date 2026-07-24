"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ExerciseVisual } from "@/src/components/exercise/exercise-visual";

type CurrentExerciseCardProps = {
  exercise: {
    slug: string;
    name: string;
    nameFr: string | null;
    primaryMuscles: string[];
    primaryMusclesFr: string[];
    equipment: string[];
    equipmentFr: string[];
    fallbackImagePath: string;
    fallbackThumbnailPath: string;
    fallbackAnimationPath: string | null;
    media: Array<{
      id?: string;
      type: "IMAGE" | "THUMBNAIL" | "ANIMATION";
      publicUrl?: string | null;
      url?: string | null;
      format?: string | null;
    }>;
  };
  setLabel: string;
  targetRepsLabel: string;
  plannedWeightLabel: string;
  previousWeightLabel?: string | null;
  cue?: string | null;
  children: ReactNode;
};

export function CurrentExerciseCard({
  exercise,
  setLabel,
  targetRepsLabel,
  plannedWeightLabel,
  previousWeightLabel,
  cue,
  children,
}: CurrentExerciseCardProps) {
  const title = exercise.nameFr || exercise.name;
  const muscle = exercise.primaryMusclesFr[0] || exercise.primaryMuscles[0] || "Full body";
  const equipment = exercise.equipmentFr[0] || exercise.equipment[0] || "Poids du corps";

  return (
    <section className="current-exercise-card">
      <ExerciseVisual
        media={exercise.media}
        fallbackAnimation={exercise.fallbackAnimationPath}
        fallbackImage={exercise.fallbackThumbnailPath || exercise.fallbackImagePath}
        title={title}
        compact
      />
      <div className="current-exercise-card__body">
        <div>
          <p className="eyebrow">{muscle} · {equipment}</p>
          <h2>{title}</h2>
        </div>
        <div className="current-exercise-card__metrics">
          <span>{setLabel}</span>
          <span>{targetRepsLabel}</span>
          <span>{plannedWeightLabel}</span>
          {previousWeightLabel ? <span>{previousWeightLabel}</span> : null}
        </div>
        {cue ? <p className="muted">{cue}</p> : null}
        {children}
        <Link href={`/exercises/${exercise.slug}`} className="outline-link">Voir la fiche exercice</Link>
      </div>
    </section>
  );
}
