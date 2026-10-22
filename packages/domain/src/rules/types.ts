export type Severity = "P1" | "P2" | "P3";

export type RuleName =
  | "plateau_detection"
  | "deload_suggestion"
  | "volume_imbalance"
  | "adherence_drop"
  | "stale_program";

export type Recommendation = {
  rule: RuleName;
  severity: Severity;
  evidence: Record<string, unknown>;
};

export const DAY_MS = 24 * 60 * 60 * 1000;
export const WEEK_MS = 7 * DAY_MS;
