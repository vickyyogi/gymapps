import type { Recommendation } from "./types";

export type PrMilestoneItem = {
  exerciseId: string;
  exerciseName?: string;
  recordType: string;
  value: number;
};

export type PrMilestoneInput = {
  recentPrs: PrMilestoneItem[];
};

/** Fires when new personal records are achieved. */
export function evaluatePrMilestone(
  input: PrMilestoneInput
): Recommendation | null {
  if (!input.recentPrs || input.recentPrs.length === 0) return null;

  const latest = input.recentPrs[0]!;
  return {
    rule: "pr_milestone",
    severity: "P3",
    evidence: {
      pr_count: input.recentPrs.length,
      latest_exercise_id: latest.exerciseId,
      latest_exercise_name: latest.exerciseName ?? null,
      record_type: latest.recordType,
      value: latest.value
    }
  };
}
