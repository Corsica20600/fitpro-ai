import Link from "next/link";
import { levelToFr } from "@/src/lib/exercise-i18n";

type ActiveFilterChipsProps = {
  search: string;
  muscle: string;
  equipment: string;
  difficulty: string;
};

function filterHref(values: ActiveFilterChipsProps, keyToRemove: keyof ActiveFilterChipsProps) {
  const params = new URLSearchParams();
  if (keyToRemove !== "search" && values.search) params.set("q", values.search);
  if (keyToRemove !== "muscle" && values.muscle) params.set("muscle", values.muscle);
  if (keyToRemove !== "equipment" && values.equipment) params.set("equipment", values.equipment);
  if (keyToRemove !== "difficulty" && values.difficulty) params.set("difficulty", values.difficulty);
  const query = params.toString();
  return query ? `/exercises?${query}` : "/exercises";
}

function difficultyLabel(value: string) {
  if (value === "BEGINNER" || value === "INTERMEDIATE" || value === "ADVANCED") {
    return levelToFr(value);
  }
  return value;
}

export function ActiveFilterChips(values: ActiveFilterChipsProps) {
  const chips = [
    values.search ? { key: "search" as const, label: `Recherche: ${values.search}` } : null,
    values.muscle ? { key: "muscle" as const, label: `Muscle: ${values.muscle}` } : null,
    values.equipment ? { key: "equipment" as const, label: `Matériel: ${values.equipment}` } : null,
    values.difficulty ? { key: "difficulty" as const, label: `Niveau: ${difficultyLabel(values.difficulty)}` } : null,
  ].filter(Boolean) as Array<{ key: keyof ActiveFilterChipsProps; label: string }>;

  if (chips.length === 0) return null;

  return (
    <div className="chips active-filter-chips" aria-label="Filtres actifs">
      {chips.map((chip) => (
        <Link key={chip.key} href={filterHref(values, chip.key)} className="chip">
          {chip.label} ×
        </Link>
      ))}
      <Link href="/exercises" className="outline-link">Tout effacer</Link>
    </div>
  );
}
