import { z } from "zod";

export const threadCreateSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  program_id: z.string().min(1).optional()
});

export const threadListSchema = z.object({
  cursor: z.string().max(500).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30)
});

export const messageListSchema = z.object({
  cursor: z.string().max(500).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50)
});

export const messageSendSchema = z.object({
  content: z.string().trim().min(1).max(4000),
  language: z.enum(["id", "en"]).optional()
});

export const feedbackSchema = z.object({
  rating: z.union([z.literal(1), z.literal(-1)]),
  comment: z.string().trim().max(1000).optional()
});

export const recommendationListSchema = z.object({
  status: z.enum(["new", "read", "dismissed", "acted"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30)
});

export const recommendationUpdateSchema = z.object({
  status: z.enum(["read", "dismissed", "acted"])
});

export const exportCreateSchema = z.object({
  format: z.enum(["csv", "json"]),
  entities: z
    .array(z.enum(["workouts", "sets", "programs", "body_metrics", "notes", "exercises"]))
    .min(1)
    .max(6)
    .optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional()
});

export const reportCreateSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  include_body_metrics: z.boolean().default(true)
});

export const notificationListSchema = z.object({
  unread_only: z.enum(["true", "false"]).transform((value) => value === "true").default("false"),
  limit: z.coerce.number().int().min(1).max(100).default(30)
});

export const exerciseAdminListSchema = z.object({
  q: z.string().trim().max(100).optional(),
  status: z.enum(["published", "draft", "archived"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50)
});

export const exerciseAdminUpdateSchema = z.object({
  name_id: z.string().trim().min(1).max(120).optional(),
  name_en: z.string().trim().min(1).max(120).optional(),
  description_id: z.string().trim().max(3000).nullable().optional(),
  description_en: z.string().trim().max(3000).nullable().optional(),
  instructions_id: z.array(z.string().trim().min(1).max(500)).max(30).optional(),
  instructions_en: z.array(z.string().trim().min(1).max(500)).max(30).optional(),
  primary_muscle: z
    .enum([
      "chest", "back", "shoulders", "biceps", "triceps", "forearms", "quads",
      "hamstrings", "glutes", "calves", "abs", "obliques", "adductors",
      "abductors", "lats", "traps", "lower_back", "full_body", "cardio", "core"
    ])
    .optional(),
  secondary_muscles: z
    .array(
      z.enum([
        "chest", "back", "shoulders", "biceps", "triceps", "forearms", "quads",
        "hamstrings", "glutes", "calves", "abs", "obliques", "adductors",
        "abductors", "lats", "traps", "lower_back", "full_body", "cardio", "core"
      ])
    )
    .max(10)
    .optional(),
  equipment: z
    .array(
      z.enum([
        "bodyweight", "dumbbell", "barbell", "machine", "cable", "bench",
        "pullup_bar", "kettlebell", "resistance_band", "cardio_machine",
        "smith_machine", "dip_bar", "landmine", "sled", "other"
      ])
    )
    .max(15)
    .optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  impact_level: z.enum(["low", "medium", "high"]).optional(),
  contraindicated_areas: z.array(z.string().trim().max(40)).max(20).optional(),
  is_compound: z.boolean().optional(),
  status: z.enum(["published", "draft", "archived"]).optional(),
  review_notes: z.string().trim().max(2000).nullable().optional()
});
