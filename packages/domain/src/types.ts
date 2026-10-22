export type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "forearms"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves"
  | "abs"
  | "obliques"
  | "adductors"
  | "abductors"
  | "lats"
  | "traps"
  | "lower_back"
  | "full_body"
  | "cardio"
  | "core";

export type EquipmentType =
  | "bodyweight"
  | "dumbbell"
  | "barbell"
  | "machine"
  | "cable"
  | "bench"
  | "pullup_bar"
  | "kettlebell"
  | "resistance_band"
  | "cardio_machine"
  | "smith_machine"
  | "dip_bar"
  | "landmine"
  | "sled"
  | "other";

export type BodyArea =
  | "knee"
  | "lower_back"
  | "shoulder"
  | "elbow"
  | "wrist"
  | "hip"
  | "ankle"
  | "neck";

export type ExerciseMeta = {
  id: string;
  name: string;
  primaryMuscle: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: EquipmentType[];
  kind: "compound" | "isolation";
  contraindications: BodyArea[];
};
