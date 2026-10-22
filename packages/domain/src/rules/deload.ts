import type { Recommendation } from "./types";

export type DeloadInput = {
  weeklyVolumes: number[];
  weeksSinceStart?: number;
  hasDeloadWeek?: boolean;
};

/** Fires on 3 consecutive >20% weekly jumps, or 5+ weeks without a deload. */
export function evaluateDeload(input: DeloadInput): Recommendation | null {
  const volumes = input.weeklyVolumes;
  const increases: number[] = [];

  for (let index = 1; index < volumes.length; index += 1) {
    const previous = volumes[index - 1]!;
    const current = volumes[index]!;
    if (previous > 0) increases.push(((current - previous) / previous) * 100);
  }

  const lastThree = increases.slice(-3);
  const surge = lastThree.length === 3 && lastThree.every((value) => value > 20);
  const overdue =
    (input.weeksSinceStart ?? 0) >= 5 && input.hasDeloadWeek !== true;

  if (!surge && !overdue) return null;

  return {
    rule: "deload_suggestion",
    severity: "P1",
    evidence: {
      reason: surge ? "volume_surge" : "weeks_without_deload",
      weekly_volumes: volumes.slice(-4),
      increases_pct: lastThree.map((value) => Math.round(value * 10) / 10),
      weeks_since_start: input.weeksSinceStart ?? null,
      has_deload_week: input.hasDeloadWeek ?? false
    }
  };
}
