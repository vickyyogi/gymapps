import type { Recommendation } from "./types";

export type ImbalanceInput = {
  weeklyPushPullRatios: number[];
};

/** Push/pull ratio outside 0.7-1.3 for at least 2 consecutive weeks. */
export function evaluateImbalance(input: ImbalanceInput): Recommendation | null {
  const weeks = input.weeklyPushPullRatios.slice(-2);
  if (weeks.length < 2) return null;

  const low = weeks.every((ratio) => ratio > 0 && ratio < 0.7);
  const high = weeks.every((ratio) => ratio > 1.3);
  if (!low && !high) return null;

  return {
    rule: "volume_imbalance",
    severity: "P2",
    evidence: {
      weekly_push_pull_ratios: weeks,
      direction: low ? "pull_dominant" : "push_dominant"
    }
  };
}
