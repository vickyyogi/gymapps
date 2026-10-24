import type { Recommendation } from "./types";

export type FrequencyLowInput = {
  weeklySessionCounts: number[];
  targetDaysPerWeek?: number;
};

/** Fires when session frequency is < 2 sessions/week for at least 2 weeks. */
export function evaluateFrequencyLow(
  input: FrequencyLowInput
): Recommendation | null {
  const counts = input.weeklySessionCounts.slice(-3);
  if (counts.length < 2) return null;

  const target = input.targetDaysPerWeek ?? 3;
  const isLow = counts.every((count) => count < 2 || count <= target - 2);
  if (!isLow) return null;

  const total = counts.reduce((sum, c) => sum + c, 0);
  const avg = Math.round((total / counts.length) * 10) / 10;

  return {
    rule: "frequency_low",
    severity: "P3",
    evidence: {
      weekly_session_counts: counts,
      target_days_per_week: target,
      avg_sessions_per_week: avg
    }
  };
}
