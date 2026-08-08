export function calculateBodyFatPercentage(weightKg: number | null | undefined, fatMassKg: number | null | undefined) {
  if (weightKg == null || fatMassKg == null || !Number.isFinite(weightKg) || !Number.isFinite(fatMassKg)) {
    return null;
  }

  if (weightKg <= 0 || fatMassKg < 0) return null;
  return Number(((fatMassKg / weightKg) * 100).toFixed(2));
}
