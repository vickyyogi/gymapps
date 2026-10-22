import type { Prisma } from "@gymapps/db";
import type {
  Exercise,
  Program,
  ProgramExercise,
  Workout,
  WorkoutExercise,
  WorkoutSet
} from "@gymapps/db";

function numberValue(value: { toString(): string } | number): number {
  return Number(value);
}

function nullableNumber(value: { toString(): string } | number | null): number | null {
  return value === null ? null : Number(value);
}

function iso(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

export function serializeExercise(exercise: Exercise) {
  return {
    id: exercise.id,
    slug: exercise.slug,
    name_id: exercise.nameId,
    name_en: exercise.nameEn,
    description_id: exercise.descriptionId,
    description_en: exercise.descriptionEn,
    primary_muscle: exercise.primaryMuscle,
    secondary_muscles: exercise.secondaryMuscles,
    equipment: exercise.equipment,
    difficulty: exercise.difficulty,
    movement_pattern: exercise.movementPattern,
    impact_level: exercise.impactLevel,
    is_compound: exercise.isCompound,
    status: exercise.status,
    source: exercise.source,
    media: []
  };
}

export function serializeExerciseDetail(exercise: Exercise, stats: {
  last_performed_at: Date | null;
  session_count: number;
  best_set: string | null;
  best_est_1rm_kg: number | null;
  volume_30d_kg: number;
}) {
  return {
    ...serializeExercise(exercise),
    instructions_id: exercise.instructionsId,
    instructions_en: exercise.instructionsEn,
    stats
  };
}

export function serializeProgram(program: Program, completionPct: number) {
  return {
    id: program.id,
    name: program.name,
    description: program.description,
    status: program.status,
    source: program.source,
    goal: program.goal,
    split_type: program.splitType,
    duration_weeks: program.durationWeeks,
    days_per_week: program.daysPerWeek,
    session_minutes: program.sessionMinutes,
    start_date: program.startDate ? program.startDate.toISOString().slice(0, 10) : null,
    progression_type: program.progressionType,
    ai_generated: program.aiGenerated,
    ai_rationale: (program.aiRationale as Record<string, unknown> | null) ?? null,
    completion_pct: Math.round(completionPct * 10) / 10,
    created_at: program.createdAt.toISOString(),
    updated_at: program.updatedAt.toISOString()
  };
}

export const programDetailInclude = {
  weeks: {
    orderBy: { weekNumber: "asc" },
    include: {
      sessions: {
        orderBy: { dayIndex: "asc" },
        include: {
          exercises: {
            orderBy: { position: "asc" },
            include: { exercise: true }
          }
        }
      }
    }
  }
} satisfies Prisma.ProgramInclude;

export type ProgramDetailPayload = Prisma.ProgramGetPayload<{
  include: typeof programDetailInclude;
}>;

export function serializeProgramExercise(
  item: ProgramExercise & { exercise: Exercise }
) {
  return {
    id: item.id,
    exercise_id: item.exerciseId,
    exercise_name: item.exercise.nameId,
    position: item.position,
    target_sets: item.targetSets,
    target_reps_min: item.targetRepsMin,
    target_reps_max: item.targetRepsMax,
    target_rpe: nullableNumber(item.targetRpe),
    rest_seconds: item.restSeconds,
    tempo: item.tempo,
    is_warmup: item.isWarmup,
    superset_group: item.supersetGroup,
    notes: item.notes,
    progression: (item.progression as Record<string, unknown> | null) ?? null
  };
}

export function serializeProgramDetail(program: ProgramDetailPayload) {
  const sessions = program.weeks.flatMap((week) => week.sessions);
  const completed = sessions.filter((session) => session.completedAt).length;
  const completionPct = sessions.length ? (completed / sessions.length) * 100 : 0;

  return {
    ...serializeProgram(program, completionPct),
    weeks: program.weeks.map((week) => ({
      id: week.id,
      week_number: week.weekNumber,
      focus_note: week.focusNote,
      is_deload: week.isDeload,
      volume_multiplier: numberValue(week.volumeMultiplier),
      sessions: week.sessions.map((session) => ({
        id: session.id,
        week_number: week.weekNumber,
        day_index: session.dayIndex,
        name: session.name,
        notes: session.notes,
        estimated_minutes: session.estimatedMinutes,
        completed_at: iso(session.completedAt),
        exercises: session.exercises.map(serializeProgramExercise)
      }))
    }))
  };
}

export function serializeWorkout(
  workout: Workout,
  counts: { exerciseCount: number; prCount: number }
) {
  return {
    id: workout.id,
    title: workout.title,
    status: workout.status,
    program_id: workout.programId,
    started_at: workout.startedAt.toISOString(),
    ended_at: iso(workout.endedAt),
    duration_seconds: workout.durationSeconds,
    total_volume_kg: numberValue(workout.totalVolumeKg),
    total_sets: workout.totalSets,
    total_reps: workout.totalReps,
    bodyweight_kg: nullableNumber(workout.bodyweightKg),
    session_rpe: nullableNumber(workout.sessionRpe),
    exercise_count: counts.exerciseCount,
    pr_count: counts.prCount
  };
}

export type PreviousSet = { set_number: number; weight_kg: number; reps: number };
export type PreviousPerformance = { date: string; sets: PreviousSet[] };

export function serializeWorkoutSet(set: WorkoutSet, previous?: PreviousSet) {
  const weight = numberValue(set.weightKg);
  return {
    id: set.id,
    set_number: set.setNumber,
    weight_kg: weight,
    reps: set.reps,
    rpe: nullableNumber(set.rpe),
    is_warmup: set.isWarmup,
    is_completed: set.isCompleted,
    is_pr: set.isPr,
    est_1rm_kg: nullableNumber(set.est1rmKg),
    volume_kg: numberValue(set.volumeKg),
    duration_seconds: set.durationSeconds,
    distance_km: nullableNumber(set.distanceKm),
    delta_vs_last: previous
      ? { weight_kg: weight - previous.weight_kg, reps: set.reps - previous.reps }
      : null
  };
}

export const workoutSummaryInclude = {
  exercises: { select: { id: true } },
  sets: { where: { isPr: true, deletedAt: null }, select: { id: true } }
} satisfies Prisma.WorkoutInclude;

export const workoutDetailInclude = {
  exercises: {
    orderBy: { position: "asc" },
    include: {
      exercise: true,
      sets: {
        where: { deletedAt: null },
        orderBy: { setNumber: "asc" }
      }
    }
  }
} satisfies Prisma.WorkoutInclude;

export type WorkoutDetailPayload = Prisma.WorkoutGetPayload<{
  include: typeof workoutDetailInclude;
}>;

export function serializeWorkoutExercise(
  item: WorkoutExercise & { exercise: Exercise; sets: WorkoutSet[] },
  previous?: PreviousPerformance
) {
  return {
    id: item.id,
    exercise_id: item.exerciseId,
    exercise_name: item.exercise.nameId,
    position: item.position,
    notes: item.notes,
    superset_group: item.supersetGroup,
    previous_performance: previous ?? null,
    sets: item.sets.map((set, index) =>
      serializeWorkoutSet(set, previous?.sets[index] ?? previous?.sets.at(-1))
    )
  };
}

export function serializeWorkoutDetail(
  workout: WorkoutDetailPayload,
  previousByExercise: Map<string, PreviousPerformance> = new Map()
) {
  const sets = workout.exercises.flatMap((item) => item.sets);
  return {
    ...serializeWorkout(workout, {
      exerciseCount: workout.exercises.length,
      prCount: sets.filter((set) => set.isPr).length
    }),
    notes: workout.notes,
    exercises: workout.exercises.map((item) =>
      serializeWorkoutExercise(item, previousByExercise.get(item.exerciseId))
    )
  };
}
