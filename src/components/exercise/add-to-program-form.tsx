"use client";

import { useMemo, useState } from "react";
import { BrandSelect } from "@/src/components/ui/brand-select";
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
      <BrandSelect
        name="programId"
        value={programId}
        onValueChange={(nextProgramId) => {
          setProgramId(nextProgramId);
          const nextProgram = programs.find((p) => p.id === nextProgramId);
          setDayId(nextProgram?.days[0]?.id ?? "");
        }}
        options={programs.map((program) => ({ value: program.id, label: program.name }))}
      />

      {days.length > 1 ? (
        <>
          <label className="field-label">Séance du programme</label>
          <BrandSelect
            name="dayId"
            value={effectiveDayId}
            onValueChange={setDayId}
            options={days.map((day) => ({
              value: day.id,
              label: day.title || `Séance ${day.dayIndex}`,
            }))}
          />
        </>
      ) : (
        <input type="hidden" name="dayId" value={effectiveDayId} />
      )}

      <div className="grid-2">
        <div>
          <label className="field-label">Séries</label>
          <input className="input" type="number" name="sets" min={1} max={12} defaultValue={3} />
        </div>
        <div>
          <label className="field-label">Répétitions</label>
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
