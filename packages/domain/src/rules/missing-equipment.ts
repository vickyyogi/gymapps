import type { Recommendation } from "./types";

export type ProgramExerciseEquipment = {
  exerciseId: string;
  exerciseName?: string;
  equipment: string[];
};

export type MissingEquipmentInput = {
  programExercises: ProgramExerciseEquipment[];
  userEquipment: string[];
};

/** Fires when active program exercises require equipment not owned by user. */
export function evaluateMissingEquipment(
  input: MissingEquipmentInput
): Recommendation | null {
  if (!input.programExercises.length) return null;

  // Bodyweight is always available
  const owned = new Set([...input.userEquipment, "bodyweight"]);
  const conflicts: Array<{
    exercise_id: string;
    exercise_name?: string;
    missing_equipment: string[];
  }> = [];

  for (const item of input.programExercises) {
    if (!item.equipment.length) continue;
    // An exercise can be performed if at least one of its compatible equipment options is owned,
    // or if none of its required equipment is owned, it's missing.
    const hasAnyEquipment = item.equipment.some((eq) => owned.has(eq));
    if (!hasAnyEquipment) {
      conflicts.push({
        exercise_id: item.exerciseId,
        exercise_name: item.exerciseName,
        missing_equipment: item.equipment
      });
    }
  }

  if (conflicts.length === 0) return null;

  return {
    rule: "missing_equipment_conflict",
    severity: "P2",
    evidence: {
      conflict_count: conflicts.length,
      conflicts: conflicts.slice(0, 5)
    }
  };
}
