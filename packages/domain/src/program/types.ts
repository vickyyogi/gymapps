import type { BodyArea, EquipmentType, ExerciseMeta } from "../types";

export type SplitType =
  | "full_body"
  | "upper_lower"
  | "push_pull_legs"
  | "bro_split"
  | "custom";

export type ProgressionType =
  | "double_progression"
  | "linear"
  | "rpe_target"
  | "percent_1rm"
  | "none";

export type Progression = {
  type: ProgressionType;
  incrementKg?: number;
  incrementReps?: number;
  maxReps?: number;
};

export type ProgramExercise = {
  exerciseId: string;
  position: number;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
  restSeconds: number;
  targetRpe?: number;
  targetPercent1rm?: number;
  isWarmup?: boolean;
  supersetGroup?: number;
  progression: Progression;
};

export type ProgramSession = {
  dayIndex: number;
  name: string;
  focus: string;
  estimatedMinutes?: number;
  exercises: ProgramExercise[];
};

export type ProgramWeek = {
  weekNumber: number;
  isDeload?: boolean;
  volumeMultiplier?: number;
  sessions: ProgramSession[];
};

export type Program = {
  splitType: SplitType;
  durationWeeks: number;
  daysPerWeek: number;
  sessionMinutes: number;
  progressionType: ProgressionType;
  weeks: ProgramWeek[];
};

export type ValidationIssue = {
  rule: `V-${string}`;
  path: string;
  message: string;
};

export type ValidationResult = {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
};

export type ValidationContext = {
  catalog: ExerciseMeta[];
  availableEquipment: EquipmentType[];
  injuries?: BodyArea[];
  isStrength?: boolean;
};
