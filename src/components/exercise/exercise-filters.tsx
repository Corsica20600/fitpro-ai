import Link from "next/link";
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
      <select id="exercise-muscle" name="muscle" defaultValue={muscle} className="input">
        <option value="">Tous les muscles</option>
        {filters.muscles.map((item) => (
          <option key={item} value={item}>{item}</option>
        ))}
      </select>

      <label className="field-label" htmlFor="exercise-equipment">Matériel</label>
      <select id="exercise-equipment" name="equipment" defaultValue={equipment} className="input">
        <option value="">Tout le matériel</option>
        {filters.equipment.map((item) => (
          <option key={item} value={item}>{item}</option>
        ))}
      </select>

      {filters.difficulties?.length ? (
        <>
          <label className="field-label" htmlFor="exercise-difficulty">Difficulté</label>
          <select id="exercise-difficulty" name="difficulty" defaultValue={difficulty} className="input">
            <option value="">Tous les niveaux</option>
            {filters.difficulties.map((item) => (
              <option key={item} value={item}>{levelToFr(item)}</option>
            ))}
          </select>
        </>
      ) : null}

      <div className="exercise-filter-actions">
        <button type="submit" className="primary-button">Filtrer</button>
        <Link href="/exercises" className="outline-link">Réinitialiser</Link>
      </div>
    </form>
  );
}
