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
  plannedWeightKg: number | null;
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

type WakeLockSentinelLike = {
  released: boolean;
  release: () => Promise<void>;
};

type WakeLockNavigator = Navigator & {
  wakeLock?: {
    request: (type: "screen") => Promise<WakeLockSentinelLike>;
  };
};

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
  const [weightByKey, setWeightByKey] = useState<Record<string, number>>({});
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const lastSyncedWatchPositionRef = useRef<string>("");
  const wakeLockRef = useRef<WakeLockSentinelLike | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const prevRestRemainingRef = useRef<number>(0);
  const pushSyncState = useCallback((nextExerciseIndex: number, nextSetIndex: number, nextRest: number) => {
    void fetch("/api/watch/syncWorkoutState", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        workoutSessionId: sessionId,
        currentExerciseIndex: Math.max(0, nextExerciseIndex),
        currentSetIndex: Math.max(1, nextSetIndex),
        status: "ACTIVE",
        lastSyncAt: new Date().toISOString(),
        restRemaining: Math.max(0, nextRest),
      }),
    });
  }, [sessionId]);

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

  const playRestFinishedBeep = useCallback(() => {
    try {
      const audioContext = audioCtxRef.current ?? new AudioContext();
      audioCtxRef.current = audioContext;
      if (audioContext.state === "suspended") {
        void audioContext.resume();
      }
      const now = audioContext.currentTime;
      for (let i = 0; i < 2; i += 1) {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, now + i * 0.18);
        gain.gain.setValueAtTime(0.0001, now + i * 0.18);
        gain.gain.exponentialRampToValueAtTime(0.12, now + i * 0.18 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.18 + 0.14);
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.start(now + i * 0.18);
        osc.stop(now + i * 0.18 + 0.16);
      }
    } catch {
      // Keep workout flow resilient if audio API is unavailable.
    }
  }, []);

  useEffect(() => {
    const previous = prevRestRemainingRef.current;
    if (previous > 0 && restRemaining === 0) {
      playRestFinishedBeep();
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate?.([120, 80, 120]);
      }
    }
    prevRestRemainingRef.current = restRemaining;
  }, [restRemaining, playRestFinishedBeep]);

  useEffect(() => {
    const nav = navigator as WakeLockNavigator;

    const requestWakeLock = async () => {
      try {
        if (!nav.wakeLock || document.visibilityState !== "visible") return;
        if (wakeLockRef.current && !wakeLockRef.current.released) return;
        wakeLockRef.current = await nav.wakeLock.request("screen");
      } catch {
        // Wake Lock may be blocked by browser/power policy; ignore gracefully.
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void requestWakeLock();
      }
    };

    void requestWakeLock();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      if (wakeLockRef.current && !wakeLockRef.current.released) {
        void wakeLockRef.current.release();
      }
      wakeLockRef.current = null;
    };
  }, []);

  useEffect(() => {
    let alive = true;

    async function pullWatchState() {
      try {
        const response = await fetch(`/api/watch/current-session?sessionId=${encodeURIComponent(sessionId)}`, {
          cache: "no-store",
        });
        if (!response.ok) return;
        const state = await response.json() as {
          exerciseIndex?: number;
          setIndex?: number;
          totalSets?: number;
          restRemaining?: number;
          status?: string;
        };

        if (!alive || state.status !== "IN_PROGRESS") return;
        const exerciseIndexFromWatch = Math.max(1, Number(state.exerciseIndex ?? 1)) - 1;
        const setIndexFromWatch = Math.max(1, Number(state.setIndex ?? 1));
        const restFromWatch = Math.max(0, Number(state.restRemaining ?? 0));
        const guard = `${exerciseIndexFromWatch}:${setIndexFromWatch}:${restFromWatch}`;
        if (lastSyncedWatchPositionRef.current === guard) return;
        lastSyncedWatchPositionRef.current = guard;

        setExerciseIndex((prev) => {
          const next = Math.max(0, Math.min(exercises.length - 1, exerciseIndexFromWatch));
          return prev === next ? prev : next;
        });
        setRestChoice(getPlannedRestForIndex(exerciseIndexFromWatch));
        setRestRemaining(restFromWatch);

        const exerciseFromWatch = exercises[Math.max(0, Math.min(exercises.length - 1, exerciseIndexFromWatch))];
        if (!exerciseFromWatch) return;

        const planned = buildPlannedReps(exerciseFromWatch);
        const completedUntil = Math.max(0, setIndexFromWatch - 1);
        if (completedUntil <= 0) return;

        setCompletedSets((prev) => {
          const fromExercise = prev.filter((item) => item.exerciseId === exerciseFromWatch.id);
          const bySetIndex = new Map<number, CompletedSet>();
          for (const item of fromExercise) bySetIndex.set(item.setIndex, item);

          const strictForExercise: CompletedSet[] = [];
          for (let idx = 1; idx <= completedUntil; idx += 1) {
            const existing = bySetIndex.get(idx);
            strictForExercise.push(
              existing ?? {
                id: `watch-sync-${exerciseFromWatch.id}-${idx}`,
                exerciseId: exerciseFromWatch.id,
                setIndex: idx,
                targetRepsMin: planned[Math.max(0, idx - 1)] ?? 10,
                actualReps: null,
                actualWeightKg: null,
                createdAt: new Date().toISOString(),
              },
            );
          }

          return [
            ...prev.filter((item) => item.exerciseId !== exerciseFromWatch.id),
            ...strictForExercise,
          ];
        });
      } catch {
        // Keep local workout resilient if watch endpoint is temporarily unavailable.
      }
    }

    const interval = window.setInterval(pullWatchState, 1000);
    void pullWatchState();
    return () => {
      alive = false;
      window.clearInterval(interval);
    };
  }, [sessionId, exercises, getPlannedRestForIndex]);

  async function onValidateSet(setIndex: number, plannedReps: number) {
    const key = `${exercise.id}:${setIndex}`;
    const actualReps = Math.max(1, repsByKey[key] ?? plannedReps);
    const actualWeightKg = Math.max(0, weightByKey[key] ?? exercise.plannedWeightKg ?? 0);

    const response = await fetch("/api/workout/log-set", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sessionId,
        exerciseId: exercise.id,
        currentExerciseIndex: exerciseIndex,
        totalSetsForExercise: setRows.length,
        setIndex,
        targetReps: plannedReps,
        actualReps,
        actualWeightKg,
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
    const isLastSetForExercise = setIndex >= setRows.length;
    const optimisticExerciseIndex = isLastSetForExercise
      ? Math.max(0, Math.min(exercises.length - 1, exerciseIndex + 1))
      : exerciseIndex;
    const optimisticSetIndex = isLastSetForExercise ? 1 : (setIndex + 1);
    setRestRemaining(restChoice);
    if (isLastSetForExercise && exerciseIndex < exercises.length - 1) {
      setExerciseIndex(optimisticExerciseIndex);
      setRestChoice(getPlannedRestForIndex(optimisticExerciseIndex));
    }
    pushSyncState(optimisticExerciseIndex, optimisticSetIndex, restChoice);
    try {
      const strictStateRes = await fetch(`/api/watch/current-session?sessionId=${encodeURIComponent(sessionId)}`, { cache: "no-store" });
      if (strictStateRes.ok) {
        const strictState = await strictStateRes.json() as { exerciseIndex?: number; setIndex?: number; restRemaining?: number };
        let strictExerciseIndex = Math.max(1, Number(strictState.exerciseIndex ?? 1)) - 1;
        const strictSetIndex = Math.max(1, Number(strictState.setIndex ?? (setIndex + 1)));
        const strictRest = Math.max(0, Number(strictState.restRemaining ?? restChoice));
        if (isLastSetForExercise && strictExerciseIndex < optimisticExerciseIndex) {
          strictExerciseIndex = optimisticExerciseIndex;
        }
        setExerciseIndex(Math.max(0, Math.min(exercises.length - 1, strictExerciseIndex)));
        setRestChoice(getPlannedRestForIndex(strictExerciseIndex));
        setRestRemaining(strictRest);
        lastSyncedWatchPositionRef.current = `${strictExerciseIndex}:${strictSetIndex}:${strictRest}`;
      }
    } catch {
      // No-op: UI keeps last known local state if strict read fails.
    }
  }

  function goToExercise(nextIdx: number) {
    const clamped = Math.max(0, Math.min(exercises.length - 1, nextIdx));
    setExerciseIndex(clamped);
    setRestChoice(getPlannedRestForIndex(clamped));
    pushSyncState(clamped, 1, 0);
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
        <PrimaryAction type="button" onClick={() => router.push("/dashboard")}>Terminer</PrimaryAction>
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
  const weightFromCompleted = activeSet?.existing?.actualWeightKg ?? null;
  const activeWeight = activeSet ? Math.max(0, weightByKey[activeKey] ?? weightFromCompleted ?? exercise.plannedWeightKg ?? 0) : 0;

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
        <div className="workout-active-reps">
          <span>Poids (kg)</span>
          <div className="workout-reps-control">
            <button
              type="button"
              className="ghost-btn"
              onClick={() => activeSet && setWeightByKey((prev) => ({ ...prev, [activeKey]: Math.max(0, activeWeight - 1) }))}
            >
              -
            </button>
            <strong>{activeWeight}</strong>
            <button
              type="button"
              className="ghost-btn"
              onClick={() => activeSet && setWeightByKey((prev) => ({ ...prev, [activeKey]: activeWeight + 1 }))}
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
        <button
          type="button"
          className="outline-link"
          onClick={onCompleteWorkout}
          disabled={ending}
        >
          {ending ? "..." : "Finir la seance"}
        </button>
      </div>
    </section>
  );
}
