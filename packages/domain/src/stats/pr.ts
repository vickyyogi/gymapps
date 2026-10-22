import { estimateOneRm } from "./one-rm";

export type RecordType = "max_weight" | "max_reps" | "max_volume" | "est_1rm";

export type PersonalRecord = {
  type: RecordType;
  value: number;
  weightKg: number;
  reps: number;
};

export type BestRecords = Partial<Record<RecordType, number>>;

export type SetInput = {
  weightKg: number;
  reps: number;
};

/**
 * Returns records that beat the stored bests. Caller appends them to
 * personal_records; existing rows are never overwritten.
 */
export function detectPersonalRecords(set: SetInput, bests: BestRecords): PersonalRecord[] {
  const weightKg = Math.max(0, set.weightKg);
  const reps = Math.max(0, set.reps);
  const candidates: PersonalRecord[] = [
    { type: "max_weight", value: weightKg, weightKg, reps },
    { type: "max_reps", value: reps, weightKg, reps },
    { type: "max_volume", value: weightKg * reps, weightKg, reps }
  ];

  const estimated = estimateOneRm(weightKg, reps);
  if (estimated !== null) {
    candidates.push({ type: "est_1rm", value: estimated, weightKg, reps });
  }

  return candidates.filter((candidate) => candidate.value > (bests[candidate.type] ?? 0));
}

/** Append-only history: existing PR rows are never mutated. */
export function appendPersonalRecords(
  history: PersonalRecord[],
  records: PersonalRecord[]
): PersonalRecord[] {
  return [...history, ...records];
}
