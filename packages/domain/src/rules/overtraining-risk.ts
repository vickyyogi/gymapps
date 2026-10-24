import type { Recommendation } from "./types";

export type OvertrainingRiskInput = {
  weeklyVolumes: number[];
};

/** Fires when weekly volume increases > 20% for 3 or more consecutive weeks. */
export function evaluateOvertrainingRisk(
  input: OvertrainingRiskInput
): Recommendation | null {
  const volumes = input.weeklyVolumes;
  const increases: number[] = [];

  for (let index = 1; index < volumes.length; index += 1) {
    const previous = volumes[index - 1]!;
    const current = volumes[index]!;
    if (previous > 0) increases.push(((current - previous) / previous) * 100);
  }

  const lastThree = increases.slice(-3);
  const surge = lastThree.length === 3 && lastThree.every((value) => value > 20);
  if (!surge) return null;

  return {
    rule: "overtraining_risk",
    severity: "P1",
    evidence: {
      weekly_volumes: volumes.slice(-4),
      increases_pct: lastThree.map((value) => Math.round(value * 10) / 10),
      consecutive_surges: lastThree.length
    }
  };
}
