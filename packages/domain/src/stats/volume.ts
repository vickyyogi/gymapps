import type { MuscleGroup } from "../types";

export type VolumeSet = {
  weightKg: number;
  reps: number;
  isWarmup?: boolean;
};

export type MuscleWeightedSets = {
  primaryMuscle: MuscleGroup;
  secondaryMuscles?: MuscleGroup[];
  workingSets: number;
};

const SECONDARY_WEIGHT = 0.5;

export function setVolume(weightKg: number, reps: number): number {
  if (!Number.isFinite(weightKg) || !Number.isFinite(reps) || weightKg < 0 || reps < 0) {
    return 0;
  }
  return weightKg * reps;
}

export function totalVolume(sets: VolumeSet[]): number {
  return sets.reduce(
    (total, set) => total + (set.isWarmup ? 0 : setVolume(set.weightKg, set.reps)),
    0
  );
}

/** Weekly working sets per muscle: primary 1.0, each secondary 0.5. */
export function setsByMuscle(entries: MuscleWeightedSets[]): Partial<Record<MuscleGroup, number>> {
  const totals: Partial<Record<MuscleGroup, number>> = {};

  for (const entry of entries) {
    const sets = Math.max(0, entry.workingSets);
    totals[entry.primaryMuscle] = (totals[entry.primaryMuscle] ?? 0) + sets;

    for (const muscle of entry.secondaryMuscles ?? []) {
      totals[muscle] = (totals[muscle] ?? 0) + sets * SECONDARY_WEIGHT;
    }
  }

  return totals;
}

export function volumeDeltaPct(current: number, previous: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}
