"use client";

import Image from "next/image";

type NextExerciseCardProps = {
  exercise?: {
    name: string;
    nameFr: string | null;
    primaryMuscles: string[];
    primaryMusclesFr: string[];
    fallbackThumbnailPath: string;
    fallbackImagePath: string;
    plannedSets: number | null;
    plannedWeightKg: number | null;
  } | null;
};

export function NextExerciseCard({ exercise }: NextExerciseCardProps) {
  if (!exercise) {
    return (
      <section className="next-exercise-card">
        <p className="eyebrow">À suivre</p>
        <h2>Fin de séance en approche</h2>
        <p className="muted">Tu es sur le dernier exercice prévu.</p>
      </section>
    );
  }

  const title = exercise.nameFr || exercise.name;
  const muscle = exercise.primaryMusclesFr[0] || exercise.primaryMuscles[0] || "Full body";
  const image = exercise.fallbackThumbnailPath || exercise.fallbackImagePath;

  return (
    <section className="next-exercise-card">
      {image ? <Image src={image} alt={title} width={220} height={140} /> : null}
      <div>
        <p className="eyebrow">À suivre</p>
        <h2>{title}</h2>
        <p className="muted">{muscle} · {exercise.plannedSets ?? 3} séries{exercise.plannedWeightKg != null ? ` · ${exercise.plannedWeightKg} kg` : ""}</p>
      </div>
    </section>
  );
}
