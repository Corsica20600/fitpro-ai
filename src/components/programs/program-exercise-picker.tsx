"use client";

import { useMemo, useState } from "react";
import { PrimaryButton } from "@/src/components/ui/primary-button";

type DayOption = {
  id: string;
  dayIndex: number;
  title: string;
};

type ExerciseOption = {
  id: string;
  name: string;
  nameFr: string | null;
  primaryAnimationPath: string | null;
  primaryMuscles: string[];
  primaryMusclesFr: string[];
  fallbackThumbnailPath: string;
  fallbackImagePath: string;
};

function WheelNumber({
  label,
  name,
  min,
  max,
  defaultValue,
}: {
  label: string;
  name: string;
  min: number;
  max: number;
  defaultValue: number;
}) {
  const [value, setValue] = useState(defaultValue);
  const clamped = Math.max(min, Math.min(max, value));

  function step(delta: number) {
    setValue((v) => Math.max(min, Math.min(max, v + delta)));
  }

  return (
    <div className="wheel-field">
      <label className="field-label">{label}</label>
      <input type="hidden" name={name} value={clamped} />
      <div className="wheel-control">
        <button type="button" className="wheel-btn" onClick={() => step(-1)}>-</button>
        <strong>{clamped}</strong>
        <button type="button" className="wheel-btn" onClick={() => step(1)}>+</button>
      </div>
    </div>
  );
}

export function ProgramExercisePicker({
  programId,
  days,
  exercises,
  action,
}: {
  programId: string;
  days: DayOption[];
  exercises: ExerciseOption[];
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [dayId, setDayId] = useState(days[0]?.id ?? "");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return exercises.slice(0, 30);
    return exercises
      .filter((ex) => {
        const muscle = ex.primaryMusclesFr[0] || ex.primaryMuscles[0] || "";
        return `${ex.nameFr || ex.name} ${muscle}`.toLowerCase().includes(q);
      })
      .slice(0, 30);
  }, [exercises, query]);

  if (!days.length) return null;

  return (
    <section className="card">
      <p className="eyebrow">Ajouter un exercice</p>
      <label className="field-label" htmlFor={`day-${programId}`}>Jour cible</label>
      <select
        id={`day-${programId}`}
        className="input"
        value={dayId}
        onChange={(event) => setDayId(event.target.value)}
      >
        {days.map((day) => (
          <option key={day.id} value={day.id}>
            Jour {day.dayIndex} · {day.title}
          </option>
        ))}
      </select>

      <label className="field-label" htmlFor={`search-${programId}`}>Recherche</label>
      <input
        id={`search-${programId}`}
        className="input"
        placeholder="Nom ou muscle..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      <section className="program-picker-grid">
        {filtered.map((exercise) => {
          const title = exercise.nameFr || exercise.name;
          const muscle = exercise.primaryMusclesFr[0] || exercise.primaryMuscles[0] || "Full body";
          const image = exercise.primaryAnimationPath || exercise.fallbackThumbnailPath || exercise.fallbackImagePath;

          return (
            <article key={exercise.id} className="program-picker-card">
              <img src={image} alt={title} className="program-picker-image" />
              <div className="program-picker-body">
                <h4>{title}</h4>
                <p>{muscle}</p>
              </div>

              <form action={action} className="form-grid program-picker-form">
                <input type="hidden" name="programId" value={programId} />
                <input type="hidden" name="dayId" value={dayId} />
                <input type="hidden" name="exerciseId" value={exercise.id} />

                <div className="grid-2">
                  <WheelNumber label="Series" name="sets" min={1} max={12} defaultValue={3} />
                  <WheelNumber label="Repos (sec)" name="restSeconds" min={15} max={300} defaultValue={60} />
                </div>
                <div className="grid-2">
                  <WheelNumber label="Repetitions" name="repetitions" min={1} max={60} defaultValue={10} />
                  <WheelNumber label="Poids (kg)" name="targetWeightKg" min={0} max={300} defaultValue={0} />
                </div>

                <PrimaryButton type="submit">Ajouter</PrimaryButton>
              </form>
            </article>
          );
        })}
      </section>
    </section>
  );
}
