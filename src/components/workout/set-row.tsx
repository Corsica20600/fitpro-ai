import { PrimaryButton } from "@/src/components/ui/primary-button";

type SetRowProps = {
  setIndex: number;
  defaultReps?: number | null;
  defaultWeight?: number | null;
  sessionId: string;
  exerciseId: string;
  action: (formData: FormData) => Promise<void>;
};

export function SetRow({
  setIndex,
  defaultReps,
  defaultWeight,
  sessionId,
  exerciseId,
  action,
}: SetRowProps) {
  return (
    <form action={action} className="set-row">
      <input type="hidden" name="sessionId" value={sessionId} />
      <input type="hidden" name="exerciseId" value={exerciseId} />
      <div className="set-row-left">Serie {setIndex}</div>
      <div className="set-row-fields">
        <input
          name="actualReps"
          type="number"
          min={1}
          defaultValue={defaultReps ?? undefined}
          className="set-input"
          placeholder="Reps"
        />
        <input
          name="actualWeightKg"
          type="number"
          min={0}
          step="0.5"
          defaultValue={defaultWeight ?? undefined}
          className="set-input"
          placeholder="Kg"
        />
      </div>
      <PrimaryButton type="submit" fullWidth={false} className="set-validate-btn">
        Valider
      </PrimaryButton>
    </form>
  );
}
