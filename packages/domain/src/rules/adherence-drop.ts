import type { Recommendation } from "./types";

export type AdherenceDropInput = {
  plannedSessions: number;
  completedSessions: number;
};

/** Current-week completion below 60%. */
export function evaluateAdherenceDrop(
  input: AdherenceDropInput
): Recommendation | null {
  if (input.plannedSessions <= 0) return null;

  const ratio = input.completedSessions / input.plannedSessions;
  if (ratio >= 0.6) return null;

  return {
    rule: "adherence_drop",
    severity: "P2",
    evidence: {
      planned_sessions: input.plannedSessions,
      completed_sessions: input.completedSessions,
      completed_ratio: Math.round(ratio * 100) / 100
    }
  };
}
