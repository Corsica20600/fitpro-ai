type ProgramSummaryProps = {
  totalPrograms: number;
  activeCount: number;
  totalDays: number;
  totalExercises: number;
};

export function ProgramSummary({ totalPrograms, activeCount, totalDays, totalExercises }: ProgramSummaryProps) {
  return (
    <section className="program-summary-grid" aria-label="Résumé des programmes">
      <span><b>{totalPrograms}</b> programmes</span>
      <span><b>{activeCount}</b> actif</span>
      <span><b>{totalDays}</b> séances</span>
      <span><b>{totalExercises}</b> exercices</span>
    </section>
  );
}
