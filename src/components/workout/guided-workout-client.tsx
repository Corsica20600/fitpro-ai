"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent, TouchEvent } from "react";
import { useRouter } from "next/navigation";
import { ExerciseVisual } from "@/src/components/exercise/exercise-visual";
import { PrimaryAction } from "@/src/components/ui/primary-action";

type WorkoutExercise = {
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
  fallbackAnimationPath: string;
  plannedSets: number | null;
  plannedRepsMin: number | null;
  plannedRepsMax: number | null;
  plannedRestSeconds: number | null;
  media: Array<{
    id: string;
    type: "IMAGE" | "THUMBNAIL" | "ANIMATION";
    publicUrl: string;
    url: string | null;
    format: string;
  }>;
};

type ExistingSet = {
  id: string;
  exerciseId: string;
  setIndex: number;
  targetRepsMin: number | null;
  actualReps: number | null;
  actualWeightKg: number | null;
  createdAt: string;
};

type CompletedSet = {
  id: string;
  exerciseId: string;
  setIndex: number;
  targetRepsMin: number;
  actualReps: number | null;
  actualWeightKg: number | null;
  createdAt: string;
};

type WorkoutSummary = {
  durationSeconds: number | null;
  exercisesCount: number;
  setsCount: number;
  volumeTotal: number;
};

const PLANNED_REPS = [12, 10, 10];

function buildPlannedReps(exercise: WorkoutExercise) {
  const setsCount = Math.max(1, Math.min(8, exercise.plannedSets ?? PLANNED_REPS.length));
  const targetReps = exercise.plannedRepsMin ?? exercise.plannedRepsMax ?? null;
  return Array.from({ length: setsCount }, (_, idx) => targetReps ?? PLANNED_REPS[idx] ?? PLANNED_REPS[PLANNED_REPS.length - 1] ?? 10);
}

export function GuidedWorkoutClient({
  sessionId,
  exercises,
  existingSets,
}: {
  sessionId: string;
  exercises: WorkoutExercise[];
  existingSets: ExistingSet[];
}) {
  const router = useRouter();
  const initialRestChoice = exercises[0]?.plannedRestSeconds && exercises[0].plannedRestSeconds > 0
    ? exercises[0].plannedRestSeconds
    : 90;

  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [restChoice, setRestChoice] = useState(initialRestChoice);
  const [restRemaining, setRestRemaining] = useState(0);
  const [completedSets, setCompletedSets] = useState<CompletedSet[]>(
    existingSets.map((item) => ({
      id: item.id,
      exerciseId: item.exerciseId,
      setIndex: item.setIndex,
      targetRepsMin: item.targetRepsMin ?? PLANNED_REPS[Math.max(0, item.setIndex - 1)] ?? 10,
      actualReps: item.actualReps,
      actualWeightKg: item.actualWeightKg,
      createdAt: item.createdAt,
    })),
  );
  const [ending, setEnding] = useState(false);
  const [summary, setSummary] = useState<WorkoutSummary | null>(null);
  const [repsByKey, setRepsByKey] = useState<Record<string, number>>({});
  const autoAdvanceTimerRef = useRef<number | null>(null);
  const lastAutoAdvanceRef = useRef<string>("");
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const exercise = exercises[exerciseIndex];
  const plannedRepsForExercise = buildPlannedReps(exercise);
  const completedForExercise = completedSets
    .filter((item) => item.exerciseId === exercise.id)
    .sort((a, b) => a.setIndex - b.setIndex);
  const nextSetIndex = completedForExercise.length + 1;
  const setRows = plannedRepsForExercise.map((planned, idx) => ({
    setIndex: idx + 1,
    plannedReps: planned,
    existing: completedForExercise.find((set) => set.setIndex === idx + 1),
  }));

  const getPlannedRestForIndex = useCallback((index: number) => {
    const nextRest = exercises[index]?.plannedRestSeconds;
    return nextRest && nextRest > 0 ? nextRest : 90;
  }, [exercises]);

  useEffect(() => {
    if (restRemaining <= 0) return;
    const timer = window.setTimeout(() => {
      setRestRemaining((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [restRemaining]);

  useEffect(() => {
    if (autoAdvanceTimerRef.current) {
      window.clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }

    const isExerciseDone = completedForExercise.length >= setRows.length && setRows.length > 0;
    const hasNextExercise = exerciseIndex < exercises.length - 1;
    if (!isExerciseDone || !hasNextExercise) return;

    const guardKey = `${exercise.id}:${setRows.length}`;
    if (lastAutoAdvanceRef.current === guardKey) return;

    autoAdvanceTimerRef.current = window.setTimeout(() => {
      setExerciseIndex((idx) => {
        const nextIdx = Math.min(exercises.length - 1, idx + 1);
        setRestChoice(getPlannedRestForIndex(nextIdx));
        return nextIdx;
      });
      lastAutoAdvanceRef.current = guardKey;
    }, 1200);

    return () => {
      if (autoAdvanceTimerRef.current) {
        window.clearTimeout(autoAdvanceTimerRef.current);
        autoAdvanceTimerRef.current = null;
      }
    };
  }, [completedForExercise.length, setRows.length, exerciseIndex, exercises.length, exercise.id, getPlannedRestForIndex]);

  async function onValidateSet(setIndex: number, plannedReps: number) {
    const key = `${exercise.id}:${setIndex}`;
    const actualReps = Math.max(1, repsByKey[key] ?? plannedReps);

    const response = await fetch("/api/workout/log-set", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sessionId,
        exerciseId: exercise.id,
        setIndex,
        targetReps: plannedReps,
        actualReps,
        actualWeightKg: null,
        restSeconds: restChoice,
      }),
    });

    if (!response.ok) return;
    const data = await response.json();
    const saved = data.set as CompletedSet;

    setCompletedSets((prev) => {
      const withoutSame = prev.filter((item) => !(item.exerciseId === saved.exerciseId && item.setIndex === saved.setIndex));
      return [...withoutSame, saved];
    });
    setRestRemaining(restChoice);
  }

  function goToExercise(nextIdx: number) {
    if (autoAdvanceTimerRef.current) {
      window.clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    const clamped = Math.max(0, Math.min(exercises.length - 1, nextIdx));
    setExerciseIndex(clamped);
    setRestChoice(getPlannedRestForIndex(clamped));
  }

  async function onCompleteWorkout() {
    setEnding(true);
    const response = await fetch("/api/workout/complete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    if (!response.ok) {
      setEnding(false);
      return;
    }

    const data = await response.json();
    if (data?.summary) {
      setSummary(data.summary as WorkoutSummary);
      return;
    }

    router.refresh();
  }

  function formatDuration(seconds: number | null) {
    if (!seconds || seconds <= 0) return "0 min";
    return `${Math.round(seconds / 60)} min`;
  }

  if (summary) {
    return (
      <section className="card stack" style={{ minHeight: "60vh", placeContent: "center", textAlign: "center", gap: "14px" }}>
        <p className="eyebrow">Seance terminee</p>
        <h2 className="section-title" style={{ fontSize: "1.25rem", margin: 0 }}>Bon travail</h2>
        <div className="chips" style={{ justifyContent: "center" }}>
          <span className="chip">Duree: {formatDuration(summary.durationSeconds)}</span>
          <span className="chip">Exercices: {summary.exercisesCount}</span>
          <span className="chip">Series: {summary.setsCount}</span>
          <span className="chip">Volume: {Math.round(summary.volumeTotal)} kg</span>
        </div>
        <PrimaryAction type="button" onClick={() => router.refresh()}>Terminer</PrimaryAction>
        <button type="button" className="outline-link" onClick={() => router.push("/workout")}>Recommencer</button>
      </section>
    );
  }

  const isLastExercise = exerciseIndex >= exercises.length - 1;
  const isExerciseDone = completedForExercise.length >= setRows.length && setRows.length > 0;
  const isWorkoutDone = isLastExercise && isExerciseDone;
  const activeSet = setRows[Math.max(0, Math.min(nextSetIndex - 1, setRows.length - 1))];
  const activeKey = activeSet ? `${exercise.id}:${activeSet.setIndex}` : "";
  const activeReps = activeSet ? Math.max(1, repsByKey[activeKey] ?? activeSet.plannedReps) : 10;

  function canTapToValidate() {
    return Boolean(activeSet) && !ending && restRemaining <= 0 && !isWorkoutDone;
  }

  function handleSurfaceTap(event: MouseEvent<HTMLElement>) {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    if (target.closest("button, a, input, select, textarea, label")) return;
    if (!canTapToValidate() || !activeSet) return;
    onValidateSet(activeSet.setIndex, activeSet.plannedReps);
  }

  function handleTouchStart(event: TouchEvent<HTMLElement>) {
    const touch = event.changedTouches[0];
    if (!touch) return;
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
  }

  function handleTouchEnd(event: TouchEvent<HTMLElement>) {
    const touch = event.changedTouches[0];
    if (!touch || touchStartXRef.current == null || touchStartYRef.current == null) return;
    const dx = touch.clientX - touchStartXRef.current;
    const dy = touch.clientY - touchStartYRef.current;
    touchStartXRef.current = null;
    touchStartYRef.current = null;

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    if (absDx < 48 || absDx < absDy) return;

    if (dx > 0) {
      goToExercise(exerciseIndex + 1);
      return;
    }
    goToExercise(exerciseIndex - 1);
  }

  if (restRemaining > 0) {
    return (
      <section className="card workout-rest-screen">
        <p className="eyebrow">Repos</p>
        <div className="workout-rest-timer-xl">
          {String(Math.floor(restRemaining / 60)).padStart(2, "0")}:{String(restRemaining % 60).padStart(2, "0")}
        </div>
        <button type="button" className="outline-link" onClick={() => setRestRemaining(0)}>Passer</button>
      </section>
    );
  }

  if (isWorkoutDone) {
    return (
      <section className="card workout-active-screen">
        <p className="eyebrow">Seance complete</p>
        <h2 className="workout-active-title">Terminer la seance</h2>
        <PrimaryAction type="button" className="workout-validate-main" onClick={onCompleteWorkout} disabled={ending}>
          {ending ? "..." : "Valider"}
        </PrimaryAction>
      </section>
    );
  }

  return (
    <section
      className="workout-hero workout-active-screen"
      onClick={handleSurfaceTap}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <ExerciseVisual
        media={exercise.media as never}
        fallbackAnimation={exercise.fallbackAnimationPath}
        fallbackImage={exercise.fallbackThumbnailPath || exercise.fallbackImagePath}
        title={exercise.nameFr || exercise.name}
      />
      <div className="workout-hero-body workout-active-body">
        <h2 className="workout-active-title">{exercise.nameFr || exercise.name}</h2>
        <p className="workout-active-set">Serie {Math.min(nextSetIndex, setRows.length)}/{setRows.length}</p>
        <div className="workout-active-reps">
          <span>Reps</span>
          <div className="workout-reps-control">
            <button
              type="button"
              className="ghost-btn"
              onClick={() => activeSet && setRepsByKey((prev) => ({ ...prev, [activeKey]: Math.max(1, activeReps - 1) }))}
            >
              -
            </button>
            <strong>{activeReps}</strong>
            <button
              type="button"
              className="ghost-btn"
              onClick={() => activeSet && setRepsByKey((prev) => ({ ...prev, [activeKey]: activeReps + 1 }))}
            >
              +
            </button>
          </div>
        </div>
        <PrimaryAction
          type="button"
          className="workout-validate-main"
          onClick={() => activeSet && onValidateSet(activeSet.setIndex, activeSet.plannedReps)}
          disabled={!activeSet}
        >
          Valider
        </PrimaryAction>
      </div>
    </section>
  );
}
