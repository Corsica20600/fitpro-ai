"use client";

import { useMemo, useState } from "react";
import { PrimaryButton } from "@/src/components/ui/primary-button";

type ProgramOption = {
  id: string;
  name: string;
  days: Array<{
    id: string;
    dayIndex: number;
    title: string;
  }>;
};

export function AddToProgramForm({
  exerciseId,
  programs,
  action,
}: {
  exerciseId: string;
  programs: ProgramOption[];
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [programId, setProgramId] = useState(programs[0]?.id ?? "");
  const selectedProgram = useMemo(
    () => programs.find((p) => p.id === programId) ?? programs[0] ?? null,
    [programId, programs],
  );
  const days = selectedProgram?.days ?? [];
  const [dayId, setDayId] = useState(days[0]?.id ?? "");

  const effectiveDayId = days.some((d) => d.id === dayId) ? dayId : (days[0]?.id ?? "");

  return (
    <form action={action} className="form-grid">
      <input type="hidden" name="exerciseId" value={exerciseId} />

      <label className="field-label">Programme</label>
      <select
        name="programId"
        className="input"
        value={programId}
        onChange={(event) => {
          const nextProgramId = event.target.value;
          setProgramId(nextProgramId);
          const nextProgram = programs.find((p) => p.id === nextProgramId);
          setDayId(nextProgram?.days[0]?.id ?? "");
        }}
      >
        {programs.map((program) => (
          <option key={program.id} value={program.id}>
            {program.name}
          </option>
        ))}
      </select>

      <label className="field-label">Jour du programme</label>
      <select
        name="dayId"
        className="input"
        value={effectiveDayId}
        onChange={(event) => setDayId(event.target.value)}
      >
        {days.map((day) => (
          <option key={day.id} value={day.id}>
            Jour {day.dayIndex} · {day.title}
          </option>
        ))}
      </select>

      <div className="grid-2">
        <div>
          <label className="field-label">Series</label>
          <input className="input" type="number" name="sets" min={1} max={12} defaultValue={3} />
        </div>
        <div>
          <label className="field-label">Repetitions</label>
          <input className="input" type="number" name="repetitions" min={1} max={60} defaultValue={10} />
        </div>
      </div>
      <div className="grid-2">
        <div>
          <label className="field-label">Repos (sec)</label>
          <input className="input" type="number" name="restSeconds" min={15} max={300} defaultValue={45} />
        </div>
        <div>
          <label className="field-label">Poids (kg)</label>
          <input className="input" type="number" name="targetWeightKg" min={0} max={300} defaultValue={0} />
        </div>
      </div>
      <PrimaryButton>Ajouter au programme</PrimaryButton>
    </form>
  );
}
