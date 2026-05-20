"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  closestCenter,
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { ExerciseVisual } from "@/src/components/exercise/exercise-visual";
import { PrimaryButton } from "@/src/components/ui/primary-button";

type ExerciseOption = {
  id: string;
  name: string;
  nameFr: string | null;
  primaryMuscles: string[];
  primaryMusclesFr: string[];
};

type DayExercise = {
  id: string;
  exerciseId: string;
  sets: number;
  repsMin: number | null;
  repsText: string | null;
  restSeconds: number;
  exercise: {
    id: string;
    name: string;
    nameFr: string | null;
    fallbackThumbnailPath: string;
    fallbackImagePath: string;
    primaryAnimationPath: string | null;
    media: Array<{
      type: "IMAGE" | "THUMBNAIL" | "ANIMATION";
      publicUrl: string;
      url: string | null;
      format: string;
    }>;
  };
};

function SortableExerciseCard({
  ex,
  idx,
  total,
  programId,
  exerciseOptions,
  updateAction,
  deleteAction,
  replaceAction,
  onReplace,
}: {
  ex: DayExercise;
  idx: number;
  total: number;
  programId: string;
  exerciseOptions: ExerciseOption[];
  updateAction: (formData: FormData) => void | Promise<void>;
  deleteAction: (formData: FormData) => void | Promise<void>;
  replaceAction: (formData: FormData) => void | Promise<void>;
  onReplace: (programExerciseId: string, exerciseId: string) => Promise<void>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: ex.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.92 : 1,
  };

  const [replaceExerciseId, setReplaceExerciseId] = useState(ex.exerciseId);
  const [replacing, setReplacing] = useState(false);

  async function handleReplaceSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!replaceExerciseId || replaceExerciseId === ex.exerciseId || replacing) return;
    setReplacing(true);
    try {
      await onReplace(ex.id, replaceExerciseId);
    } finally {
      setReplacing(false);
    }
  }

  return (
    <article ref={setNodeRef} style={style} className={`program-day-item ${isDragging ? "is-dragging" : ""}`}>
      <ExerciseVisual
        media={
          ex.exercise.media?.map((m) => ({
            type: m.type,
            publicUrl: m.publicUrl,
            url: m.url,
            format: String(m.format || "").toLowerCase(),
          })) ?? []
        }
        fallbackImage={ex.exercise.fallbackThumbnailPath || ex.exercise.fallbackImagePath}
        fallbackAnimation={ex.exercise.primaryAnimationPath}
        title={ex.exercise.nameFr || ex.exercise.name}
        compact
        className="program-day-item-visual"
      />
      <div>
        <div className="program-day-item-head">
          <p className="program-day-item-title">{ex.exercise.nameFr || ex.exercise.name}</p>
          <button
            type="button"
            className="reorder-btn drag-handle"
            aria-label={`Déplacer ${ex.exercise.nameFr || ex.exercise.name}`}
            title="Glisser pour réordonner"
            {...attributes}
            {...listeners}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 6a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3m6 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3M9 10.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3m6 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3M9 15a1.5 1.5 0 1 1 0 3A1.5 1.5 0 0 1 9 15m6 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3" />
            </svg>
          </button>
        </div>
        <p className="muted">
          {ex.sets} séries · {ex.repsMin ?? "?"} reps · {ex.restSeconds ?? "?"} sec · {ex.repsText || "Poids libre"}
        </p>
        <form action={updateAction} className="form-grid" style={{ marginTop: 8 }}>
          <input type="hidden" name="programId" value={programId} />
          <input type="hidden" name="programExerciseId" value={ex.id} />
          <div className="grid-2">
            <div>
              <label className="field-label">Séries</label>
              <input name="sets" type="number" defaultValue={ex.sets} className="input" />
            </div>
            <div>
              <label className="field-label">Répétitions</label>
              <input name="repetitions" type="number" defaultValue={ex.repsMin ?? 10} className="input" />
            </div>
          </div>
          <div className="grid-2">
            <div>
              <label className="field-label">Repos (sec)</label>
              <input name="restSeconds" type="number" defaultValue={ex.restSeconds ?? 60} className="input" />
            </div>
            <div>
              <label className="field-label">Poids (kg)</label>
              <input name="targetWeightKg" type="number" defaultValue={Number(ex.repsText?.replace(/[^\d.,]/g, "").replace(",", ".") || 0)} className="input" />
            </div>
          </div>
          <div className="grid-2">
            <PrimaryButton type="submit">Modifier</PrimaryButton>
            <button className="ghost-btn chip danger" type="submit" formAction={deleteAction}>Retirer</button>
          </div>
        </form>
        <form action={replaceAction} onSubmit={(event) => { void handleReplaceSubmit(event); }} className="form-grid" style={{ marginTop: 8 }}>
          <input type="hidden" name="programId" value={programId} />
          <input type="hidden" name="programExerciseId" value={ex.id} />
          <label className="field-label">Remplacer par</label>
          <select
            name="exerciseId"
            className="input"
            value={replaceExerciseId}
            onChange={(event) => setReplaceExerciseId(event.target.value)}
          >
            {exerciseOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {(opt.nameFr || opt.name)} · {(opt.primaryMusclesFr[0] || opt.primaryMuscles[0] || "Full body")}
              </option>
            ))}
          </select>
          <PrimaryButton type="submit" disabled={replacing || replaceExerciseId === ex.exerciseId}>
            {replacing ? "Remplacement..." : "Remplacer l&apos;exercice"}
          </PrimaryButton>
        </form>
        <div className="chips" style={{ marginTop: 8 }}>
          <span className="chip muted">Position : {idx + 1}/{total}</span>
        </div>
      </div>
    </article>
  );
}

export function ProgramDayExercisesEditor({
  programId,
  initialExercises,
  exerciseOptions,
  updateAction,
  deleteAction,
  replaceAction,
}: {
  programId: string;
  initialExercises: DayExercise[];
  exerciseOptions: ExerciseOption[];
  updateAction: (formData: FormData) => void | Promise<void>;
  deleteAction: (formData: FormData) => void | Promise<void>;
  replaceAction: (formData: FormData) => void | Promise<void>;
}) {
  const [exercises, setExercises] = useState(initialExercises);
  const [replaceFeedback, setReplaceFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }),
  );

  const ids = useMemo(() => exercises.map((item) => item.id), [exercises]);

  async function persistMove(exerciseId: string, direction: "up" | "down") {
    const res = await fetch(`/api/programs/${encodeURIComponent(programId)}/exercises/reorder`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ exerciseId, direction }),
    });
    if (!res.ok) {
      throw new Error(`reorder_failed_${res.status}`);
    }
  }

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = exercises.findIndex((item) => item.id === active.id);
    const newIndex = exercises.findIndex((item) => item.id === over.id);
    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;

    const previous = exercises;
    const movedId = String(active.id);
    const direction: "up" | "down" = newIndex < oldIndex ? "up" : "down";
    const hops = Math.abs(newIndex - oldIndex);

    setExercises((prev) => arrayMove(prev, oldIndex, newIndex));

    try {
      for (let i = 0; i < hops; i += 1) {
        await persistMove(movedId, direction);
      }
    } catch {
      setExercises(previous);
    }
  }

  async function onReplace(programExerciseId: string, exerciseId: string) {
    setReplaceFeedback(null);
    const response = await fetch(
      `/api/programs/${encodeURIComponent(programId)}/exercises/${encodeURIComponent(programExerciseId)}/replace`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ exerciseId }),
      },
    );

    if (!response.ok) {
      const payload = await response.json().catch(() => ({})) as { error?: string };
      setReplaceFeedback({
        type: "error",
        message: payload.error || "Impossible de remplacer cet exercice.",
      });
      return;
    }

    const payload = await response.json() as {
      programExerciseId: string;
      exerciseId: string;
      exercise: DayExercise["exercise"];
    };

    setExercises((prev) =>
      prev.map((item) => (
        item.id === payload.programExerciseId
          ? {
              ...item,
              exerciseId: payload.exerciseId,
              exercise: payload.exercise,
            }
          : item
      )),
    );
    setReplaceFeedback({ type: "success", message: "Exercice remplacé." });
    window.setTimeout(() => setReplaceFeedback(null), 1800);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={(event) => { void onDragEnd(event); }}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="program-day-list">
          {replaceFeedback ? (
            <p
              className={replaceFeedback.type === "success" ? "status-success" : "status-danger"}
              role="status"
              aria-live="polite"
            >
              {replaceFeedback.message}
            </p>
          ) : null}
          {exercises.map((ex, idx) => (
            <SortableExerciseCard
              key={ex.id}
              ex={ex}
              idx={idx}
              total={exercises.length}
              programId={programId}
              exerciseOptions={exerciseOptions}
              updateAction={updateAction}
              deleteAction={deleteAction}
              replaceAction={replaceAction}
              onReplace={onReplace}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
