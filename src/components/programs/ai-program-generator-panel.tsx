"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PrimaryButton } from "@/src/components/ui/primary-button";

type GeneratedProgram = {
  programName: string;
  goal: string;
  days: Array<{
    dayIndex: number;
    title: string;
    notes: string;
    exercises: Array<{
      exerciseSlug: string;
      sets: number;
      reps: string;
      restSeconds: number;
      tempo?: string;
      notes?: string;
    }>;
  }>;
  exercises: string[];
  notes: string;
};

export function AiProgramGeneratorPanel() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<GeneratedProgram | null>(null);
  const [savedText, setSavedText] = useState("");

  async function onGenerate(formData: FormData) {
    setLoading(true);
    setError("");
    setSavedText("");
    setResult(null);

    const payload = {
      goal: String(formData.get("goal") ?? "MUSCLE_GAIN"),
      level: String(formData.get("level") ?? "INTERMEDIATE"),
      daysPerWeek: Number(formData.get("daysPerWeek") ?? 4),
      sessionDurationMin: Number(formData.get("sessionDurationMin") ?? 60),
      availableEquipment: String(formData.get("availableEquipment") ?? "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
      priorityMuscles: String(formData.get("priorityMuscles") ?? "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
      restrictions: String(formData.get("restrictions") ?? "").trim(),
    };

    try {
      const response = await fetch("/api/programs/generate-ai", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        setError(`Generation impossible (${data?.error ?? "unknown_error"})`);
        return;
      }
      setResult(data.program);
    } catch {
      setError("Erreur reseau pendant la generation IA.");
    } finally {
      setLoading(false);
    }
  }

  async function onSave() {
    if (!result) return;
    setSaving(true);
    setError("");
    setSavedText("");
    try {
      const response = await fetch("/api/programs/save-ai", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ program: result }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        setError(`Sauvegarde impossible (${data?.error ?? "unknown_error"})`);
        return;
      }
      setSavedText(`Programme sauvegarde: ${data.programName}`);
      router.refresh();
    } catch {
      setError("Erreur reseau pendant la sauvegarde.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="card">
      <p className="eyebrow">IA programme</p>
      <form action={onGenerate} className="form-grid">
        <select name="goal" className="input" defaultValue="MUSCLE_GAIN">
          <option value="MUSCLE_GAIN">Prise de muscle</option>
          <option value="FAT_LOSS">Perte de gras</option>
          <option value="STRENGTH">Force</option>
          <option value="RECOMPOSITION">Recomposition</option>
        </select>
        <select name="level" className="input" defaultValue="INTERMEDIATE">
          <option value="BEGINNER">Debutant</option>
          <option value="INTERMEDIATE">Intermediaire</option>
          <option value="ADVANCED">Avance</option>
        </select>
        <input name="daysPerWeek" type="number" min={2} max={6} defaultValue={4} className="input" placeholder="Jours / semaine" />
        <input name="sessionDurationMin" type="number" min={25} max={120} defaultValue={60} className="input" placeholder="Duree seance (min)" />
        <input name="availableEquipment" className="input" placeholder="Materiel (csv) ex: halteres, barre, machine" />
        <input name="priorityMuscles" className="input" placeholder="Muscles prioritaires (csv)" />
        <input name="restrictions" className="input" placeholder="Douleurs / restrictions" />
        <PrimaryButton type="submit" disabled={loading}>{loading ? "Generation..." : "Generer avec l IA"}</PrimaryButton>
      </form>

      {error && <p className="muted mt-10">{error}</p>}
      {savedText && <p className="mt-10">{savedText}</p>}

      {result && (
        <div className="stack mt-10">
          <h3 className="section-title">{result.programName}</h3>
          {result.days.map((day) => (
            <section key={day.dayIndex} className="card">
              <p className="eyebrow">Jour {day.dayIndex}</p>
              <h4 className="section-title">{day.title}</h4>
              <p className="muted">{day.notes}</p>
              <div className="stack mt-10">
                {day.exercises.map((ex, idx) => (
                  <p key={`${day.dayIndex}-${idx}`} className="muted">
                    {idx + 1}. {ex.exerciseSlug} · {ex.sets}x{ex.reps} · repos {ex.restSeconds}s{ex.tempo ? ` · tempo ${ex.tempo}` : ""}
                  </p>
                ))}
              </div>
            </section>
          ))}
          <PrimaryButton type="button" onClick={onSave} disabled={saving}>
            {saving ? "Sauvegarde..." : "Sauvegarder ce programme"}
          </PrimaryButton>
        </div>
      )}
    </section>
  );
}
