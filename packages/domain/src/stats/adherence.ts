export type PlannedSession = {
  dayIndex: number;
  completed: boolean;
};

/**
 * Completed planned sessions / planned sessions that are already due.
 * Days later in the week are not misses yet (FR-08-06).
 */
export function weeklyAdherence(
  sessions: PlannedSession[],
  todayIndex: number
): number | null {
  const today = Math.min(7, Math.max(1, Math.trunc(todayIndex)));
  const due = sessions.filter((session) => session.dayIndex <= today);

  if (due.length === 0) return null;

  const completed = due.filter((session) => session.completed).length;
  return completed / due.length;
}
