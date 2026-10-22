import type { Recommendation } from "./types";

export type PlateauInput = {
  estimatedOneRm: number[];
  plannedSets: number;
  completedSets: number;
};

/** Flat e1RM (<1% range) over the last 3 working sets, with >=90% completion. */
export function evaluatePlateau(input: PlateauInput): Recommendation | null {
  const values = input.estimatedOneRm.slice(-3);
  if (values.length < 3) return null;

  const max = Math.max(...values);
  const min = Math.min(...values);
  if (max <= 0) return null;

  const flat = (max - min) / max < 0.01;
  const completion =
    input.plannedSets > 0 ? input.completedSets / input.plannedSets : 0;

  if (!flat || completion < 0.9) return null;

  return {
    rule: "plateau_detection",
    severity: "P1",
    evidence: {
      estimated_1rm_kg: values,
      range_pct: Math.round(((max - min) / max) * 1000) / 10,
      completed_ratio: Math.round(completion * 100) / 100
    }
  };
}
