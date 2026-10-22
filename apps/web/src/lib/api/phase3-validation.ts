import { z } from "zod";

const MUSCLES = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "forearms",
  "quads",
  "hamstrings",
  "glutes",
  "calves",
  "abs",
  "obliques",
  "adductors",
  "abductors",
  "lats",
  "traps",
  "lower_back",
  "full_body",
  "cardio",
  "core"
] as const;

const EQUIPMENT = [
  "bodyweight",
  "dumbbell",
  "barbell",
  "machine",
  "cable",
  "bench",
  "pullup_bar",
  "kettlebell",
  "resistance_band",
  "cardio_machine",
  "smith_machine",
  "dip_bar",
  "landmine",
  "sled",
  "other"
] as const;

const DIFFICULTY = ["beginner", "intermediate", "advanced"] as const;
const SPLITS = ["full_body", "upper_lower", "push_pull_legs", "bro_split", "custom"] as const;
const PROGRESSIONS = ["double_progression", "linear", "rpe_target", "percent_1rm", "none"] as const;

const muscle = z.enum(MUSCLES);
const equipment = z.enum(EQUIPMENT);
const boolParam = z.enum(["true", "false"]).transform((value) => value === "true");
const cursor = z.string().max(500).optional();

function csvEnum<T extends readonly [string, ...string[]]>(values: T) {
  return z.preprocess(
    (value) =>
      typeof value === "string"
        ? value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : value,
    z.array(z.enum(values)).min(1).max(values.length)
  );
}

export const exerciseListSchema = z.object({
  q: z.string().trim().max(100).optional(),
  muscle: muscle.optional(),
  equipment: csvEnum(EQUIPMENT).optional(),
  difficulty: z.enum(DIFFICULTY).optional(),
  available_only: boolParam.optional(),
  include_custom: boolParam.default("true"),
  cursor,
  limit: z.coerce.number().int().min(1).max(100).default(30)
});

export const createExerciseSchema = z.object({
  name_id: z.string().trim().min(1).max(120),
  name_en: z.string().trim().min(1).max(120).optional(),
  description_id: z.string().trim().max(500).optional(),
  instructions_id: z.array(z.string().trim().min(1).max(500)).max(6).default([]),
  primary_muscle: muscle,
  secondary_muscles: z.array(muscle).max(10).default([]),
  equipment: z.array(equipment).min(1).max(15),
  difficulty: z.enum(DIFFICULTY).default("intermediate")
});

export const updateExerciseSchema = createExerciseSchema
  .omit({ name_id: true, equipment: true })
  .partial()
  .extend({
    name_id: z.string().trim().min(1).max(120).optional(),
    instructions_en: z.array(z.string().trim().min(1).max(500)).max(6).optional(),
    equipment: z.array(equipment).min(1).max(15).optional(),
    status: z.enum(["draft", "published", "archived"]).optional()
  });

export const programInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(1000).optional(),
  goal: z.string().trim().max(80).optional(),
  split_type: z.enum(SPLITS),
  duration_weeks: z.number().int().min(1).max(52),
  days_per_week: z.number().int().min(1).max(7),
  session_minutes: z.number().int().min(20).max(120).default(60),
  start_date: z.coerce.date().optional(),
  progression_type: z.enum(PROGRESSIONS).default("double_progression")
});

export const programListSchema = z.object({
  status: z.enum(["draft", "active", "completed", "archived"]).optional(),
  cursor,
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export const programSessionSchema = z.object({
  week_number: z.number().int().min(1).max(52),
  day_index: z.number().int().min(1).max(7),
  name: z.string().trim().min(1).max(60),
  notes: z.string().trim().max(1000).optional(),
  estimated_minutes: z.number().int().min(5).max(300).optional()
});

export const programExerciseSchema = z.object({
  exercise_id: z.string().min(1),
  position: z.number().int().min(1).max(20).optional(),
  target_sets: z.number().int().min(1).max(10).default(3),
  target_reps_min: z.number().int().min(1).max(50).default(8),
  target_reps_max: z.number().int().min(1).max(50).default(12),
  target_rpe: z.number().min(5).max(10).optional(),
  rest_seconds: z.number().int().min(30).max(300).default(90),
  tempo: z.string().trim().max(30).optional(),
  is_warmup: z.boolean().default(false),
  superset_group: z.number().int().min(1).max(9).optional(),
  notes: z.string().trim().max(200).optional(),
  progression: z
    .object({
      type: z.string().max(40),
      increment_kg: z.number().nonnegative().optional(),
      increment_reps: z.number().int().nonnegative().optional(),
      max_reps: z.number().int().positive().optional()
    })
    .optional()
});

export const updateProgramExerciseSchema = programExerciseSchema.partial();

export const workoutListSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  program_id: z.string().optional(),
  status: z.enum(["active", "finished", "abandoned"]).optional(),
  cursor,
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export const startWorkoutSchema = z.object({
  source: z.enum(["quick", "program", "template"]),
  program_session_id: z.string().optional(),
  template_id: z.string().optional(),
  title: z.string().trim().max(120).optional(),
  started_at: z.coerce.date().optional()
});

export const updateWorkoutSchema = z.object({
  title: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(5000).optional(),
  bodyweight_kg: z.number().min(0).max(500).optional(),
  session_rpe: z.number().min(1).max(10).optional()
});

export const addWorkoutExerciseSchema = z.object({
  exercise_id: z.string().min(1),
  notes: z.string().trim().max(1000).optional(),
  superset_group: z.number().int().min(1).max(9).optional()
});

export const workoutSetSchema = z
  .object({
    weight_kg: z.number().min(0).max(1000).default(0),
    reps: z.number().int().min(0).max(500).default(0),
    rpe: z.number().min(0.5).max(10).optional(),
    is_warmup: z.boolean().default(false),
    is_completed: z.boolean().default(true),
    duration_seconds: z.number().int().nonnegative().optional(),
    distance_km: z.number().nonnegative().optional(),
    avg_heart_rate: z.number().int().min(30).max(230).optional(),
    calories: z.number().int().nonnegative().optional()
  })
  .refine((value) => value.weight_kg > 0 || value.reps > 0 || value.duration_seconds, {
    message: "Set needs weight × reps or a duration",
    path: ["reps"]
  });

export const updateSetSchema = z.object({
  weight_kg: z.number().min(0).max(1000).optional(),
  reps: z.number().int().min(0).max(500).optional(),
  rpe: z.number().min(0.5).max(10).optional(),
  is_completed: z.boolean().optional()
});
