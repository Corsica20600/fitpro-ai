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
  primaryMuscles: string[];
  primaryMusclesFr: string[];
  fallbackThumbnailPath: string;
  fallbackImagePath: string;
};

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
    if (!q) return exercises.slice(0, 60);
    return exercises
      .filter((ex) => {
        const muscle = ex.primaryMusclesFr[0] || ex.primaryMuscles[0] || "";
        return `${ex.nameFr || ex.name} ${muscle}`.toLowerCase().includes(q);
      })
      .slice(0, 60);
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

      <label className="field-label" htmlFor={`search-${programId}`}>Rechercher un exercice</label>
      <input
        id={`search-${programId}`}
        className="input"
        placeholder="Ex: squat, pectoraux, halteres..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      <section className="program-picker-grid">
        {filtered.map((exercise) => {
          const title = exercise.nameFr || exercise.name;
          const muscle = exercise.primaryMusclesFr[0] || exercise.primaryMuscles[0] || "Full body";
          const image = exercise.fallbackThumbnailPath || exercise.fallbackImagePath;

          return (
            <article key={exercise.id} className="program-picker-card">
              <img src={image} alt={title} className="program-picker-image" />
              <div className="program-picker-body">
                <h4>{title}</h4>
                <p>{muscle}</p>
              </div>

              <form action={action} className="form-grid">
                <input type="hidden" name="programId" value={programId} />
                <input type="hidden" name="dayId" value={dayId} />
                <input type="hidden" name="exerciseId" value={exercise.id} />

                <div className="grid-2">
                  <div>
                    <label className="field-label">Series</label>
                    <input name="sets" type="number" min={1} max={12} defaultValue={4} className="input" />
                  </div>
                  <div>
                    <label className="field-label">Repos (sec)</label>
                    <input name="restSeconds" type="number" min={15} max={300} defaultValue={90} className="input" />
                  </div>
                </div>

                <div className="grid-2">
                  <div>
                    <label className="field-label">Repetitions min</label>
                    <input name="repsMin" type="number" min={1} max={40} defaultValue={8} className="input" />
                  </div>
                  <div>
                    <label className="field-label">Repetitions max</label>
                    <input name="repsMax" type="number" min={1} max={60} defaultValue={12} className="input" />
                  </div>
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
