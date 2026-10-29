import "server-only";

import { prisma, type MuscleGroup } from "@gymapps/db";
import { estimateOneRm, volumeDeltaPct } from "@gymapps/domain";

const DAY = 24 * 60 * 60 * 1000;

export type AnalyticsRange = "4w" | "3m" | "6m" | "1y" | "all";

const RANGE_DAYS: Record<AnalyticsRange, number | null> = {
  "4w": 28,
  "3m": 90,
  "6m": 180,
  "1y": 365,
  all: null
};

export function rangeStart(range: AnalyticsRange, now = new Date()) {
  const days = RANGE_DAYS[range];
  if (!days) return null;
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  return start;
}

export function startOfWeek(date: Date) {
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);
  const day = start.getUTCDay() || 7;
  start.setUTCDate(start.getUTCDate() - (day - 1));
  return start;
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function round(value: number, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

async function finishedWorkouts(userId: string, from: Date | null, to = new Date()) {
  return prisma.workout.findMany({
    where: {
      userId,
      status: "finished",
      deletedAt: null,
      startedAt: { ...(from ? { gte: from } : {}), lte: to }
    },
    select: { id: true, startedAt: true, totalVolumeKg: true }
  });
}

async function muscleSets(userId: string, from: Date) {
  return prisma.workoutSet.findMany({
    where: {
      userId,
      isCompleted: true,
      isWarmup: false,
      deletedAt: null,
      createdAt: { gte: from },
      workout: { status: "finished", deletedAt: null }
    },
    select: {
      volumeKg: true,
      exercise: { select: { primaryMuscle: true, secondaryMuscles: true } }
    }
  });
}

function muscleBalanceRows(
  rows: Array<{
    volumeKg: unknown;
    exercise: { primaryMuscle: string; secondaryMuscles: string[] };
  }>
) {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const vol = Number(row.volumeKg);
    const primary = row.exercise.primaryMuscle;
    totals.set(primary, (totals.get(primary) ?? 0) + vol);
    for (const sec of row.exercise.secondaryMuscles) {
      totals.set(sec, (totals.get(sec) ?? 0) + vol * 0.5);
    }
  }
  const total = [...totals.values()].reduce((sum, value) => sum + value, 0);
  return [...totals.entries()]
    .map(([muscle, volume]) => ({
      muscle,
      volume_kg: round(volume),
      share_pct: total ? round((volume / total) * 100) : 0
    }))
    .sort((a, b) => b.volume_kg - a.volume_kg);
}

export async function analyticsSummary(userId: string, range: AnalyticsRange) {
  const now = new Date();
  const from = rangeStart(range, now);
  const week = startOfWeek(now);
  const sevenDays = new Date(now.getTime() - 7 * DAY);
  const fourteenDays = new Date(now.getTime() - 14 * DAY);
  const thirtyDays = new Date(now.getTime() - 30 * DAY);

  const [workouts, sets30d, prCount, lastPr, activeProgram, profile] =
    await Promise.all([
      finishedWorkouts(userId, from),
      muscleSets(userId, thirtyDays),
      prisma.personalRecord.count({ where: { userId } }),
      prisma.personalRecord.findFirst({
        where: { userId },
        orderBy: { achievedAt: "desc" },
        include: { exercise: { select: { nameId: true } } }
      }),
      prisma.program.findFirst({
        where: { userId, status: "active", deletedAt: null },
        include: { sessions: { select: { completedAt: true } } }
      }),
      prisma.userProfile.findUnique({
        where: { userId },
        select: { goals: true, daysPerWeek: true }
      })
    ]);

  const workoutsThisWeek = workouts.filter((workout) => workout.startedAt >= week).length;
  const workouts7 = workouts.filter((workout) => workout.startedAt >= sevenDays).length;
  const workoutsPrev7 = workouts.filter(
    (workout) => workout.startedAt >= fourteenDays && workout.startedAt < sevenDays
  ).length;

  const volume7 = workouts
    .filter((workout) => workout.startedAt >= sevenDays)
    .reduce((sum, workout) => sum + Number(workout.totalVolumeKg), 0);
  const volumePrev7 = workouts
    .filter((workout) => workout.startedAt >= fourteenDays && workout.startedAt < sevenDays)
    .reduce((sum, workout) => sum + Number(workout.totalVolumeKg), 0);
  const volume30 = workouts
    .filter((workout) => workout.startedAt >= thirtyDays)
    .reduce((sum, workout) => sum + Number(workout.totalVolumeKg), 0);

  const workoutDays = new Set(workouts.map((w) => isoDate(w.startedAt)));
  let streak = 0;
  const cursor = new Date(now);
  cursor.setUTCHours(0, 0, 0, 0);
  if (!workoutDays.has(isoDate(cursor))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  while (workoutDays.has(isoDate(cursor))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  let adherenceCurrentWeek: number | null = null;
  if (activeProgram && activeProgram.daysPerWeek > 0) {
    const sessions = activeProgram.sessions.filter(
      (session) => session.completedAt && session.completedAt >= week
    );
    adherenceCurrentWeek = round(
      Math.min(1, sessions.length / activeProgram.daysPerWeek),
      2
    );
  }

  const balance = muscleBalanceRows(sets30d);
  // Locale-agnostic: the client translates these with dashboard.insights.*
  const insights: Array<{ key: string; params: Record<string, string | number> }> = [];
  const deltaVolume = volumeDeltaPct(volume7, volumePrev7);
  if (deltaVolume !== null) {
    insights.push({
      key: deltaVolume >= 0 ? "volumeUp" : "volumeDown",
      params: { pct: round(Math.abs(deltaVolume)) }
    });
  }
  const top = balance[0];
  if (top && top.share_pct > 40) {
    insights.push({ key: "muscleShare", params: { muscle: top.muscle, pct: top.share_pct } });
  }
  if (workoutsThisWeek === 0) {
    insights.push({ key: "noSessions", params: {} });
  }
  if (profile?.goals.length && !activeProgram && workouts.length > 0) {
    insights.push({ key: "noProgram", params: {} });
  }

  return {
    weekly_logged_workouts: workoutsThisWeek,
    volume_7d_kg: round(volume7),
    volume_30d_kg: round(volume30),
    current_streak: streak,
    adherence_current_week: adherenceCurrentWeek,
    total_prs: prCount,
    last_pr: lastPr
      ? {
          exercise_name: lastPr.exercise.nameId,
          value: Number(lastPr.value),
          unit: lastPr.recordType,
          achieved_at: lastPr.achievedAt.toISOString()
        }
      : null,
    previous_period_delta_pct: {
      volume: deltaVolume ?? 0,
      workouts: workoutsPrev7 ? round(((workouts7 - workoutsPrev7) / workoutsPrev7) * 100) : 0,
      adherence: 0
    },
    muscle_balance: balance.slice(0, 6).map(({ muscle, share_pct }) => ({
      muscle,
      share_pct
    })),
    insights
  };
}

export async function analyticsVolume(
  userId: string,
  range: AnalyticsRange,
  exerciseId?: string,
  muscle?: MuscleGroup
) {
  const now = new Date();
  const from = rangeStart(range, now) ?? new Date(0);
  const sets = await prisma.workoutSet.findMany({
    where: {
      userId,
      isCompleted: true,
      isWarmup: false,
      deletedAt: null,
      createdAt: { gte: from },
      workout: { status: "finished", deletedAt: null },
      ...(exerciseId ? { exerciseId } : {}),
      ...(muscle ? { exercise: { primaryMuscle: muscle } } : {})
    },
    select: {
      workoutId: true,
      volumeKg: true,
      workout: { select: { startedAt: true } }
    }
  });

  const buckets = new Map<
    string,
    { week_start: string; volume_kg: number; working_sets: number; workoutIds: Set<string> }
  >();
  for (const set of sets) {
    if (set.workout.startedAt < from) continue;
    const key = isoDate(startOfWeek(set.workout.startedAt));
    const bucket = buckets.get(key) ?? {
      week_start: key,
      volume_kg: 0,
      working_sets: 0,
      workoutIds: new Set<string>()
    };
    bucket.volume_kg += Number(set.volumeKg);
    bucket.working_sets += 1;
    bucket.workoutIds.add(set.workoutId);
    buckets.set(key, bucket);
  }

  const series = [...buckets.values()]
    .sort((a, b) => a.week_start.localeCompare(b.week_start))
    .map((bucket) => ({
      week_start: bucket.week_start,
      volume_kg: round(bucket.volume_kg),
      working_sets: bucket.working_sets
    }));

  const last = series.at(-1)?.volume_kg ?? 0;
  const previous = series.at(-2)?.volume_kg ?? 0;
  const delta = volumeDeltaPct(last, previous);

  return {
    series,
    insight: {
      key: delta === null ? "volumeCollecting" : delta >= 0 ? "volumeUp" : "volumeDown",
      params: { pct: round(Math.abs(delta ?? 0)) },
      delta_pct: delta ?? 0
    }
  };
}

export async function analyticsMuscleBalance(userId: string, weeks: number) {
  const from = new Date(Date.now() - weeks * 7 * DAY);
  const rows = await muscleSets(userId, from);
  const totals = new Map<string, { volume: number; sets: number }>();
  for (const row of rows) {
    const vol = Number(row.volumeKg);
    const primary = row.exercise.primaryMuscle;
    const currentPrimary = totals.get(primary) ?? { volume: 0, sets: 0 };
    currentPrimary.volume += vol;
    currentPrimary.sets += 1;
    totals.set(primary, currentPrimary);

    for (const sec of row.exercise.secondaryMuscles) {
      const currentSec = totals.get(sec) ?? { volume: 0, sets: 0 };
      currentSec.volume += vol * 0.5;
      currentSec.sets += 0.5;
      totals.set(sec, currentSec);
    }
  }
  const total = [...totals.values()].reduce((sum, value) => sum + value.volume, 0);
  return {
    muscles: [...totals.entries()]
      .map(([muscle, value]) => ({
        muscle,
        volume_kg: round(value.volume),
        working_sets: round(value.sets, 1),
        share_pct: total ? round((value.volume / total) * 100) : 0
      }))
      .sort((a, b) => b.volume_kg - a.volume_kg)
  };
}

export async function analyticsAdherence(userId: string, weeks: number) {
  const program = await prisma.program.findFirst({
    where: { userId, status: "active", deletedAt: null },
    include: {
      weeks: {
        orderBy: { weekNumber: "asc" },
        include: { sessions: { select: { completedAt: true } } }
      }
    }
  });
  if (!program) return [];

  const now = new Date();
  const currentWeek = startOfWeek(now);
  const rows = [];
  for (let offset = weeks - 1; offset >= 0; offset -= 1) {
    const weekStart = new Date(currentWeek.getTime() - offset * 7 * DAY);
    const weekEnd = new Date(weekStart.getTime() + 7 * DAY);
    const sessions = program.weeks.flatMap((week) => week.sessions);
    const completed = sessions.filter(
      (session) =>
        session.completedAt && session.completedAt >= weekStart && session.completedAt < weekEnd
    ).length;
    rows.push({
      week_start: isoDate(weekStart),
      planned_sessions: program.daysPerWeek,
      completed_sessions: completed,
      adherence: program.daysPerWeek
        ? round(Math.min(1, completed / program.daysPerWeek), 2)
        : 0
    });
  }
  return rows;
}

export async function analyticsPersonalRecords(
  userId: string,
  exerciseId: string | undefined,
  limit: number
) {
  const rows = await prisma.personalRecord.findMany({
    where: { userId, ...(exerciseId ? { exerciseId } : {}) },
    orderBy: { achievedAt: "desc" },
    take: limit,
    include: { exercise: { select: { nameId: true } } }
  });
  const seen = new Set<string>();
  return rows.map((row) => {
    const key = `${row.exerciseId}:${row.recordType}`;
    const isCurrent = !seen.has(key);
    seen.add(key);
    return {
      id: row.id,
      exercise_id: row.exerciseId,
      exercise_name: row.exercise.nameId,
      record_type: row.recordType,
      value: Number(row.value),
      reps: row.reps,
      weight_kg: row.weightKg ? Number(row.weightKg) : null,
      achieved_at: row.achievedAt.toISOString(),
      is_current: isCurrent
    };
  });
}

export async function analyticsOneRm(userId: string, exerciseId: string, range: AnalyticsRange) {
  const from = rangeStart(range) ?? new Date(0);
  const sets = await prisma.workoutSet.findMany({
    where: {
      userId,
      exerciseId,
      isCompleted: true,
      isWarmup: false,
      deletedAt: null,
      createdAt: { gte: from },
      workout: { status: "finished", deletedAt: null }
    },
    orderBy: { createdAt: "asc" }
  });
  return {
    points: sets
      .map((set) => {
        const value = estimateOneRm(Number(set.weightKg), set.reps);
        return value
          ? {
              date: set.createdAt.toISOString(),
              est_1rm_kg: round(value),
              formula: "epley" as const
            }
          : null;
      })
      .filter((point): point is NonNullable<typeof point> => point !== null)
  };
}

export async function analyticsCalendar(userId: string, weeks: number) {
  const now = new Date();
  const currentWeek = startOfWeek(now);
  const start = new Date(currentWeek.getTime() - (weeks - 1) * 7 * DAY);
  const workouts = await prisma.workout.findMany({
    where: {
      userId,
      status: "finished",
      deletedAt: null,
      startedAt: { gte: start }
    },
    select: { startedAt: true, totalVolumeKg: true }
  });

  const byDay = new Map<string, number>();
  for (const workout of workouts) {
    const key = isoDate(workout.startedAt);
    byDay.set(key, (byDay.get(key) ?? 0) + Number(workout.totalVolumeKg));
  }
  const max = Math.max(1, ...byDay.values());
  const days = [];
  for (let offset = 0; offset < weeks * 7; offset += 1) {
    const date = new Date(start.getTime() + offset * DAY);
    const volume = byDay.get(isoDate(date)) ?? 0;
    days.push({
      date: isoDate(date),
      volume_kg: round(volume),
      intensity: volume === 0 ? 0 : Math.min(4, Math.ceil((volume / max) * 4))
    });
  }
  return { days };
}
