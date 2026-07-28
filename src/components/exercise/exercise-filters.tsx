import Link from "next/link";
import { BrandSelect } from "@/src/components/ui/brand-select";
import { levelToFr } from "@/src/lib/exercise-i18n";

type ExerciseFiltersProps = {
  search: string;
  muscle: string;
  equipment: string;
  difficulty: string;
  filters: {
    muscles: string[];
    equipment: string[];
    difficulties?: Array<"BEGINNER" | "INTERMEDIATE" | "ADVANCED">;
  };
};

export function ExerciseFilters({ search, muscle, equipment, difficulty, filters }: ExerciseFiltersProps) {
  return (
    <form method="get" className="form-grid exercise-filter-form">
      <label className="field-label" htmlFor="exercise-search">Recherche</label>
      <input
        id="exercise-search"
        name="q"
        defaultValue={search}
        className="input"
        placeholder="Nom de l'exercice"
        autoComplete="off"
      />

      <label className="field-label" htmlFor="exercise-muscle">Muscle</label>
      <BrandSelect
        id="exercise-muscle"
        name="muscle"
        defaultValue={muscle}
        options={[
          { value: "", label: "Tous les muscles" },
          ...filters.muscles.map((item) => ({ value: item, label: item })),
        ]}
      />

      <label className="field-label" htmlFor="exercise-equipment">Matériel</label>
      <BrandSelect
        id="exercise-equipment"
        name="equipment"
        defaultValue={equipment}
        options={[
          { value: "", label: "Tout le matériel" },
          ...filters.equipment.map((item) => ({ value: item, label: item })),
        ]}
      />

      {filters.difficulties?.length ? (
        <>
          <label className="field-label" htmlFor="exercise-difficulty">Difficulté</label>
          <BrandSelect
            id="exercise-difficulty"
            name="difficulty"
            defaultValue={difficulty}
            options={[
              { value: "", label: "Tous les niveaux" },
              ...filters.difficulties.map((item) => ({ value: item, label: levelToFr(item) })),
            ]}
          />
        </>
      ) : null}

      <div className="exercise-filter-actions">
        <button type="submit" className="primary-button">Filtrer</button>
        <Link href="/exercises" className="outline-link">Réinitialiser</Link>
      </div>
    </form>
  );
}
