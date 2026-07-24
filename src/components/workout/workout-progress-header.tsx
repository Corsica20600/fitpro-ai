"use client";

type WorkoutProgressHeaderProps = {
  programName?: string | null;
  sessionTitle: string;
  exercisePosition: number;
  totalExercises: number;
  setPosition: number;
  totalSets: number;
  elapsedLabel?: string | null;
};

export function WorkoutProgressHeader({
  programName,
  sessionTitle,
  exercisePosition,
  totalExercises,
  setPosition,
  totalSets,
  elapsedLabel,
}: WorkoutProgressHeaderProps) {
  const exerciseProgress = totalExercises > 0 ? ((exercisePosition - 1) / totalExercises) * 100 : 0;
  const setProgress = totalSets > 0 ? (setPosition / totalSets) * (100 / Math.max(1, totalExercises)) : 0;
  const progress = Math.min(100, Math.max(4, exerciseProgress + setProgress));

  return (
    <header className="workout-progress-header">
      <div>
        <p className="eyebrow">{programName || "Séance guidée"}</p>
        <h1>{sessionTitle}</h1>
      </div>
      <div className="workout-progress-header__meta">
        <span>Exercice {exercisePosition}/{totalExercises}</span>
        <span>Série {setPosition}/{totalSets}</span>
        {elapsedLabel ? <span>{elapsedLabel}</span> : null}
      </div>
      <div className="workout-progress-header__bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
        <i style={{ width: `${progress}%` }} />
      </div>
    </header>
  );
}
