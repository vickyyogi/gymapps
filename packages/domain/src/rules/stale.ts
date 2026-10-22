import type { Recommendation } from "./types";
import { WEEK_MS } from "./types";

export type StaleProgramInput = {
  status: "draft" | "active" | "completed" | "archived";
  durationWeeks: number;
  activatedAt: Date;
  startDate?: Date | null;
  lastCompletedAt?: Date | null;
  profileChanged?: boolean;
  now: Date;
};

/** ADR-002 option C. Draft programs are never flagged. */
export function evaluateStaleProgram(
  input: StaleProgramInput
): Recommendation | null {
  if (input.status !== "active") return null;

  const now = input.now.getTime();
  const start = (input.startDate ?? input.activatedAt).getTime();
  const activated = input.activatedAt.getTime();
  const overdue = now >= start + (input.durationWeeks + 2) * WEEK_MS;
  const abandoned =
    !input.lastCompletedAt &&
    now >= activated + 6 * WEEK_MS &&
    input.profileChanged !== true;
  const changed = input.profileChanged === true;

  if (!overdue && !abandoned && !changed) return null;

  return {
    rule: "stale_program",
    severity: "P2",
    evidence: {
      reason: changed ? "profile_changed" : overdue ? "duration_elapsed" : "abandoned",
      duration_weeks: input.durationWeeks,
      weeks_since_start: Math.floor((now - start) / WEEK_MS),
      weeks_since_last_session: input.lastCompletedAt
        ? Math.floor((now - input.lastCompletedAt.getTime()) / WEEK_MS)
        : null
    }
  };
}
