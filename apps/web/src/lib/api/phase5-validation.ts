import { z } from "zod";

const GOALS = [
  "lose_weight",
  "gain_muscle",
  "strength",
  "endurance",
  "general_fitness",
  "body_recomposition"
] as const;

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

const SPLITS = ["full_body", "upper_lower", "push_pull_legs", "bro_split", "custom"] as const;

export const programGenerateSchema = z.object({
  goal: z.enum(GOALS),
  split_type: z.enum(SPLITS),
  duration_weeks: z.number().int().min(1).max(52),
  days_per_week: z.number().int().min(1).max(7),
  session_minutes: z.number().int().min(20).max(120).optional(),
  equipment_overrides: z.array(z.enum(EQUIPMENT)).max(EQUIPMENT.length).optional(),
  focus_areas: z.array(z.enum(MUSCLES)).max(8).optional(),
  avoid_areas: z.array(z.string().trim().min(1).max(40)).max(10).optional(),
  notes: z.string().trim().max(1000).optional()
});

export type ProgramGenerateInput = z.infer<typeof programGenerateSchema>;

const SPLIT_DAYS: Record<string, [number, number]> = {
  full_body: [2, 4],
  upper_lower: [2, 4],
  push_pull_legs: [3, 3],
  bro_split: [3, 7],
  custom: [2, 7]
};

export function generateShapeError(input: ProgramGenerateInput): string | null {
  const [min, max] = SPLIT_DAYS[input.split_type] ?? [1, 7];
  if (input.days_per_week < min || input.days_per_week > max) {
    return `${input.split_type} allows ${min}-${max} days per week`;
  }
  return null;
}
