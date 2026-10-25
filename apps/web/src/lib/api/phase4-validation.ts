import { z } from "zod";

const GOALS = [
  "lose_weight",
  "gain_muscle",
  "strength",
  "endurance",
  "general_fitness",
  "body_recomposition"
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

const INJURY_AREAS = [
  "knee",
  "shoulder",
  "lower_back",
  "elbow",
  "wrist",
  "hip",
  "ankle",
  "neck",
  "hamstring",
  "groin",
  "none"
] as const;

export const profileSchema = z.object({
  goals: z.array(z.enum(GOALS)).max(2).optional(),
  experience_level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  days_per_week: z.number().int().min(1).max(7).optional(),
  session_minutes: z.number().int().min(20).max(120).optional(),
  equipment: z.array(z.enum(EQUIPMENT)).max(EQUIPMENT.length).optional(),
  injury_areas: z.array(z.enum(INJURY_AREAS)).max(INJURY_AREAS.length).optional(),
  injury_notes: z.string().trim().max(1000).optional(),
  preferred_split: z
    .enum(["full_body", "upper_lower", "push_pull_legs", "bro_split", "custom"])
    .optional(),
  preferred_cardio: z.array(z.string().trim().max(40)).max(10).optional(),
  height_cm: z.number().min(80).max(250).optional(),
  birth_date: z.coerce
    .date()
    .refine(
      (date) => {
        const now = new Date();
        const cutoff = new Date(
          Date.UTC(now.getUTCFullYear() - 16, now.getUTCMonth(), now.getUTCDate())
        );
        return date <= cutoff;
      },
      { message: "Minimum age is 16 years" }
    )
    .optional(),
  sex: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
  program_style_notes: z.string().trim().max(2000).optional(),
  display_name: z.string().trim().min(1).max(80).optional(),
  locale: z.enum(["id", "en"]).optional(),
  unit_system: z.enum(["metric", "imperial"]).optional(),
  timezone: z.string().trim().min(1).max(60).optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
  email_opt_in: z.boolean().optional()
});

export const onboardingSchema = z.object({
  step: z.enum(["goal", "level", "schedule", "equipment", "preferences", "done"])
});

export const bodyMetricSchema = z.object({
  recorded_on: z.coerce.date(),
  weight_kg: z.number().min(20).max(500).optional(),
  body_fat_pct: z.number().min(1).max(70).optional(),
  chest_cm: z.number().positive().max(300).optional(),
  waist_cm: z.number().positive().max(300).optional(),
  hip_cm: z.number().positive().max(300).optional(),
  arm_cm: z.number().positive().max(300).optional(),
  thigh_cm: z.number().positive().max(300).optional(),
  calf_cm: z.number().positive().max(300).optional(),
  shoulder_cm: z.number().positive().max(300).optional(),
  photo_urls: z.array(z.string().url()).max(3).optional(),
  notes: z.string().trim().max(1000).optional()
});

export const bodyMetricUpdateSchema = bodyMetricSchema.partial().omit({ recorded_on: true });

export const bodyMetricListSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  limit: z.coerce.number().int().min(1).max(365).default(90)
});

export const noteSchema = z.object({
  body: z.string().trim().min(1).max(5000),
  category: z.enum(["general", "injury", "nutrition", "mood", "equipment"]).default("general"),
  workout_id: z.string().optional(),
  is_pinned: z.boolean().default(false)
});

export const noteUpdateSchema = noteSchema.partial();

export const noteListSchema = z.object({
  category: z.enum(["general", "injury", "nutrition", "mood", "equipment"]).optional(),
  pinned_first: z.enum(["true", "false"]).transform((value) => value === "true").default(true),
  cursor: z.string().max(500).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30)
});

export const analyticsRangeSchema = z.object({
  range: z.enum(["4w", "3m", "6m", "1y", "all"]).default("4w")
});

export const analyticsVolumeSchema = analyticsRangeSchema.extend({
  exercise_id: z.string().optional(),
  muscle: z
    .enum([
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
    ])
    .optional()
});

export const analyticsWeeksSchema = z.object({
  weeks: z.coerce.number().int().min(1).max(26).default(4)
});

export const analyticsPrSchema = z.object({
  exercise_id: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50)
});

export const analyticsOneRmSchema = z.object({
  exercise_id: z.string().min(1),
  range: z.enum(["4w", "3m", "6m", "1y", "all"]).default("3m")
});
