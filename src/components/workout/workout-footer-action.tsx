import { PrimaryButton } from "@/src/components/ui/primary-button";

export function WorkoutFooterAction() {
  return (
    <footer className="workout-footer card">
      <button type="button" className="ghost-btn">Precedent</button>
      <PrimaryButton type="button" fullWidth={false}>Exercice suivant</PrimaryButton>
    </footer>
  );
}
