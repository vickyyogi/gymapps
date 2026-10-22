const MAX_ESTIMATE_REPS = 12;

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function valid(weightKg: number, reps: number) {
  return Number.isFinite(weightKg) && weightKg > 0 && Number.isInteger(reps) && reps > 0;
}

/** Epley: w × (1 + reps/30). */
export function epleyOneRm(weightKg: number, reps: number): number | null {
  if (!valid(weightKg, reps) || reps > MAX_ESTIMATE_REPS) return null;
  return round2(weightKg * (1 + reps / 30));
}

/** Brzycki: w × 36/(37-reps). */
export function brzyckiOneRm(weightKg: number, reps: number): number | null {
  if (!valid(weightKg, reps) || reps > MAX_ESTIMATE_REPS) return null;
  return round2((weightKg * 36) / (37 - reps));
}

/** Primary estimate. Reps above 12 are too unreliable and return null. */
export function estimateOneRm(weightKg: number, reps: number): number | null {
  return epleyOneRm(weightKg, reps);
}

export const ONE_RM_MAX_REPS = MAX_ESTIMATE_REPS;
