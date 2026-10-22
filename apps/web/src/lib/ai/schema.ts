import { z } from "zod";
import type { Program, ProgramExercise, ProgramSession, ProgramWeek, SplitType } from "@gymapps/domain";

const progression = z
  .object({
    type: z.enum(["double_progression", "linear", "rpe_target", "percent_1rm", "none"]),
    increment_kg: z.number().min(0).max(20).optional(),
    increment_reps: z.number().int().min(0).max(5).optional(),
    max_reps: z.number().int().min(1).max(50).optional()
  })
  .strict();

const exercise = z
  .object({
    exercise_id: z.string().min(1),
    position: z.number().int().min(0).max(8),
    target_sets: z.number().int().min(1).max(10),
    target_reps_min: z.number().int().min(1).max(50),
    target_reps_max: z.number().int().min(1).max(50),
    target_rpe: z.number().min(5).max(10).optional(),
    target_percent_1rm: z.number().min(30).max(100).optional(),
    rest_seconds: z.number().int().min(30).max(300),
    tempo: z.string().max(30).optional(),
    is_warmup: z.boolean(),
    superset_group: z.number().int().min(1).max(9).nullable().optional(),
    progression,
    notes: z.string().max(200).optional()
  })
  .strict()
  .refine((value) => value.target_reps_max >= value.target_reps_min, {
    message: "target_reps_max must be >= target_reps_min",
    path: ["target_reps_max"]
  });

const session = z
  .object({
    day_index: z.number().int().min(1).max(7),
    name: z.string().min(1).max(60),
    estimated_minutes: z.number().int().min(15).max(150),
    exercises: z.array(exercise).min(1).max(8)
  })
  .strict();

const week = z
  .object({
    week_number: z.number().int().min(1),
    focus_note: z.string().max(160),
    is_deload: z.boolean(),
    sessions: z.array(session).min(1)
  })
  .strict();

export const emitProgramSchema = z
  .object({
    name: z.string().min(1).max(80),
    split_type: z.enum(["full_body", "upper_lower", "push_pull_legs", "bro_split", "custom"]),
    duration_weeks: z.number().int().min(1).max(52),
    goal: z.string().max(80).optional(),
    weeks: z.array(week).min(1),
    rationale: z.string().min(1).max(1200),
    assumptions: z.array(z.string().max(200)).max(8),
    safety_notes: z.array(z.string().max(200)).max(8)
  })
  .strict();

export type EmitProgram = z.infer<typeof emitProgramSchema>;

export type NormalizedProgram = {
  name: string;
  goal?: string;
  program: Program & {
    weeks: Array<ProgramWeek & { focusNote?: string }>;
  };
  rationale: string;
  assumptions: string[];
  safetyNotes: string[];
};

export type NormalizeInput = {
  splitType: SplitType;
  daysPerWeek: number;
  durationWeeks: number;
  sessionMinutes: number;
};

export function normalizeEmitProgram(value: EmitProgram, input: NormalizeInput): NormalizedProgram {
  const weeks = value.weeks.map((rawWeek) => {
    const sessions: ProgramSession[] = rawWeek.sessions.map((rawSession) => {
      const exercises: ProgramExercise[] = rawSession.exercises.map((rawExercise) => ({
        exerciseId: rawExercise.exercise_id,
        position: rawExercise.position,
        targetSets: rawExercise.target_sets,
        targetRepsMin: rawExercise.target_reps_min,
        targetRepsMax: rawExercise.target_reps_max,
        restSeconds: rawExercise.rest_seconds,
        targetRpe: rawExercise.target_rpe,
        targetPercent1rm: rawExercise.target_percent_1rm,
        isWarmup: rawExercise.is_warmup,
        supersetGroup: rawExercise.superset_group ?? undefined,
        progression: {
          type: rawExercise.progression.type,
          incrementKg: rawExercise.progression.increment_kg,
          incrementReps: rawExercise.progression.increment_reps,
          maxReps: rawExercise.progression.max_reps
        }
      }));

      return {
        dayIndex: rawSession.day_index,
        name: rawSession.name,
        focus: rawSession.name.toLowerCase().replace(/\s+(?:[a-z]|\d+)$/i, "").trim(),
        estimatedMinutes: rawSession.estimated_minutes,
        exercises
      };
    });

    return {
      weekNumber: rawWeek.week_number,
      focusNote: rawWeek.focus_note,
      isDeload: rawWeek.is_deload,
      volumeMultiplier: 1,
      sessions
    };
  });

  return {
    name: value.name,
    goal: value.goal,
    rationale: value.rationale,
    assumptions: value.assumptions,
    safetyNotes: value.safety_notes,
    program: {
      splitType: input.splitType,
      durationWeeks: input.durationWeeks,
      daysPerWeek: input.daysPerWeek,
      sessionMinutes: input.sessionMinutes,
      progressionType: "double_progression",
      weeks
    }
  };
}

export function parseEmitProgram(raw: unknown) {
  return emitProgramSchema.safeParse(raw);
}
