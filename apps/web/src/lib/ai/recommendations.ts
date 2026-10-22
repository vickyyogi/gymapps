import "server-only";

import { prisma, Prisma } from "@gymapps/db";
import {
  evaluateAdherenceDrop,
  evaluateDeload,
  evaluateImbalance,
  evaluatePlateau,
  evaluateStaleProgram,
  type Recommendation as RuleResult
} from "@gymapps/domain";
import { narratorAiConfig } from "./config";
import { computeCostUsd } from "./client";
import { newId } from "@/lib/id";
import { log } from "@/lib/log";

const DAY_MS = 24 * 60 * 60 * 1000;
const SEVERITY_ORDER = { P1: 0, P2: 1, P3: 2 } as Record<string, number>;

const PUSH = new Set(["chest", "shoulders", "triceps"]);
const PULL = new Set(["back", "lats", "biceps", "traps", "forearms"]);

function startOfWeek(date: Date) {
  const value = new Date(date);
  value.setUTCHours(0, 0, 0, 0);
  const day = value.getUTCDay() || 7;
  value.setUTCDate(value.getUTCDate() - (day - 1));
  return value;
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}

type Candidate = {
  result: RuleResult;
  evidence: Record<string, unknown>;
  title: string;
  body: string;
  actionType: string | null;
  actionPayload?: unknown;
  relatedProgramId?: string | null;
  relatedExerciseId?: string | null;
};

function candidatesFor(
  results: Array<{
    result: RuleResult;
    programId?: string | null;
    exerciseId?: string | null;
    context?: Record<string, unknown>;
  }>,
  language: "id" | "en"
): Candidate[] {
  return results.map(({ result, programId, exerciseId, context }) => {
    const evidence = { ...result.evidence, ...(context ?? {}) } as Record<string, unknown>;
    const increases = (evidence.increases_pct as number[] | undefined) ?? [];
    const volumes = (evidence.weekly_volumes as number[] | undefined) ?? [];
    const lastIncrease = increases.at(-1);
    const ratio = evidence.completed_ratio;
    const planned = evidence.planned_sessions;
    const completed = evidence.completed_sessions;

    if (result.rule === "deload_suggestion") {
      const pct = lastIncrease ?? 0;
      const title =
        language === "en"
          ? `Weekly volume up ${pct}%`
          : `Volume mingguan naik ${pct}%`;
      const body =
        language === "en"
          ? `Weekly volume reached ${volumes.at(-1) ?? 0} kg after ${increases.length} consecutive increases above 20%. Consider one deload week at about 60% of current volume, then rebuild.`
          : `Volume mingguan mencapai ${volumes.at(-1) ?? 0} kg setelah ${increases.length} kenaikan berturut di atas 20%. Pertimbangkan 1 minggu deload sekitar 60% volume saat ini, lalu naik lagi bertahap.`;
      return {
        result,
        evidence,
        title,
        body,
        actionType: "add_deload_week",
        actionPayload: { program_id: programId ?? null },
        relatedProgramId: programId ?? null,
        relatedExerciseId: null
      };
    }

    if (result.rule === "plateau_detection") {
      const values = (evidence.estimated_1rm_kg as number[] | undefined) ?? [];
      const title =
        language === "en"
          ? `Estimated 1RM flat for 3 sessions`
          : `Estimasi 1RM datar selama 3 sesi`;
      const body =
        language === "en"
          ? `Estimated 1RM stayed within ${evidence.range_pct ?? 0}% (${values.join(", ")} kg). Keep reps in reserve and change one variable next week.`
          : `Estimasi 1RM hanya bergerak ${evidence.range_pct ?? 0}% (${values.join(", ")} kg). Jaga repetisi cadangan dan ubah satu variabel minggu depan.`;
      return {
        result,
        evidence,
        title,
        body,
        actionType: "view_exercise",
        actionPayload: { exercise_id: exerciseId ?? null },
        relatedProgramId: null,
        relatedExerciseId: exerciseId ?? null
      };
    }

    if (result.rule === "volume_imbalance") {
      const direction = String(evidence.direction ?? "");
      const title =
        language === "en" ? "Push/pull volume is unbalanced" : "Volume push/pull tidak seimbang";
      const body =
        language === "en"
          ? `Push/pull ratio stayed outside 0.7-1.3 for 2 weeks (${direction.replace("_", " ")}). Add volume to the lagging side, not to the dominant side.`
          : `Rasio push/pull keluar dari 0.7-1.3 selama 2 minggu (${direction.replace("_", " ")}). Tambah volume sisi yang tertinggal, bukan sisi dominan.`;
      return {
        result,
        evidence,
        title,
        body,
        actionType: "adjust_volume",
        actionPayload: { direction },
        relatedProgramId: programId ?? null,
        relatedExerciseId: null
      };
    }

    if (result.rule === "adherence_drop") {
      const title =
        language === "en" ? "Completed sessions below target" : "Sesi selesai di bawah target";
      const body =
        language === "en"
          ? `You completed ${completed ?? 0} of ${planned ?? 0} planned sessions this week (${ratio ?? 0} ratio). Pick the smallest next session to rebuild momentum.`
          : `Kamu menyelesaikan ${completed ?? 0} dari ${planned ?? 0} sesi minggu ini (rasio ${ratio ?? 0}). Pilih sesi terpendek untuk membangun ritme lagi.`;
      return {
        result,
        evidence,
        title,
        body,
        actionType: "view_program",
        actionPayload: { program_id: programId ?? null },
        relatedProgramId: programId ?? null,
        relatedExerciseId: null
      };
    }

    const title = language === "en" ? "Program needs a refresh" : "Program perlu diperbarui";
    const body =
      language === "en"
        ? `Program age is ${evidence.weeks_since_start ?? 0} weeks. Review the next block based on current performance and recovery.`
        : `Usia program ${evidence.weeks_since_start ?? 0} minggu. Review blok berikutnya berdasarkan performa dan pemulihan saat ini.`;
    return {
      result,
      evidence,
      title,
      body,
      actionType: "view_program",
      actionPayload: { program_id: programId ?? null },
      relatedProgramId: programId ?? null,
      relatedExerciseId: null
    };
  });
}

export async function evaluateRecommendationsForUser(options: {
  userId: string;
  triggerWorkoutId?: string;
  now?: Date;
}) {
  const now = options.now ?? new Date();
  const weekStart = startOfWeek(now);
  const since35 = new Date(now.getTime() - 35 * DAY_MS);
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: options.userId },
    select: { locale: true }
  });
  const language = user.locale === "en" ? "en" : "id";

  const [program, workouts, dismissed, recentExisting] = await Promise.all([
    prisma.program.findFirst({
      where: { userId: options.userId, status: "active", deletedAt: null },
      include: {
        weeks: { select: { isDeload: true, weekNumber: true } },
        sessions: {
          select: { id: true, completedAt: true },
          orderBy: { completedAt: "desc" }
        }
      }
    }),
    prisma.workout.findMany({
      where: {
        userId: options.userId,
        status: "finished",
        deletedAt: null,
        startedAt: { gte: since35 }
      },
      select: { id: true, startedAt: true, totalVolumeKg: true }
    }),
    prisma.aiRecommendation.findMany({
      where: {
        userId: options.userId,
        status: "dismissed",
        dismissedUntil: { gt: now }
      },
      select: { rule: true }
    }),
    prisma.aiRecommendation.findMany({
      where: {
        userId: options.userId,
        status: { in: ["new", "read"] },
        createdAt: { gte: new Date(now.getTime() - 7 * DAY_MS) }
      },
      select: { rule: true }
    })
  ]);

  const blockedRules = new Set([
    ...dismissed.map((row) => row.rule),
    ...recentExisting.map((row) => row.rule)
  ]);

  const weekly = new Map<string, number>();
  for (const workout of workouts) {
    const key = isoDate(startOfWeek(workout.startedAt));
    weekly.set(key, (weekly.get(key) ?? 0) + Number(workout.totalVolumeKg));
  }
  const weeklyRows = [...weekly.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, volume]) => ({ week, volume_kg: round(volume) }));
  const weeklyVolumes = weeklyRows.map((row) => row.volume_kg);

  const weeksSinceStart = program
    ? Math.floor(
        (now.getTime() - (program.startDate ?? program.createdAt).getTime()) /
          (7 * DAY_MS)
      )
    : 0;
  const hasDeloadWeek = Boolean(program?.weeks.some((week) => week.isDeload));

  const raw: Array<{
    result: RuleResult;
    programId?: string | null;
    exerciseId?: string | null;
    context?: Record<string, unknown>;
  }> = [];

  const deload = evaluateDeload({
    weeklyVolumes,
    weeksSinceStart,
    hasDeloadWeek
  });
  if (deload) {
    raw.push({
      result: deload,
      programId: program?.id ?? null,
      context: {
        metric: "weekly_volume_growth",
        value: (deload.evidence.increases_pct as number[] | undefined)?.at(-1) ?? 0,
        unit: "%",
        delta_pct: (deload.evidence.increases_pct as number[] | undefined)?.at(-1) ?? 0,
        series: weeklyRows.slice(-4)
      }
    });
  }

  if (program) {
    const completedThisWeek = program.sessions.filter(
      (session) => session.completedAt && session.completedAt >= weekStart
    ).length;
    const adherence = evaluateAdherenceDrop({
      plannedSessions: program.daysPerWeek,
      completedSessions: completedThisWeek
    });
    if (adherence) {
      raw.push({
        result: adherence,
        programId: program.id,
        context: {
          metric: "completed_sessions",
          value: completedThisWeek,
          unit: "sessions",
          delta_pct: null,
          series: []
        }
      });
    }

    const lastCompleted = program.sessions.find((session) => session.completedAt)?.completedAt;
    const stale = evaluateStaleProgram({
      status: "active",
      durationWeeks: program.durationWeeks,
      activatedAt: program.startDate ?? program.createdAt,
      startDate: program.startDate,
      lastCompletedAt: lastCompleted ?? null,
      profileChanged: false,
      now
    });
    if (stale) {
      raw.push({
        result: stale,
        programId: program.id,
        context: {
          metric: "weeks_since_start",
          value: weeksSinceStart,
          unit: "weeks",
          delta_pct: null,
          series: weeklyRows.slice(-4)
        }
      });
    }
  }

  const pushPull = await prisma.workoutSet.findMany({
    where: {
      userId: options.userId,
      isCompleted: true,
      isWarmup: false,
      deletedAt: null,
      createdAt: { gte: new Date(now.getTime() - 21 * DAY_MS) },
      workout: { status: "finished", deletedAt: null }
    },
    select: { volumeKg: true, createdAt: true, exercise: { select: { primaryMuscle: true } } }
  });
  const ratios = new Map<string, { push: number; pull: number }>();
  for (const set of pushPull) {
    const key = isoDate(startOfWeek(set.createdAt));
    const bucket = ratios.get(key) ?? { push: 0, pull: 0 };
    const muscle = set.exercise.primaryMuscle;
    if (PUSH.has(muscle)) bucket.push += Number(set.volumeKg);
    if (PULL.has(muscle)) bucket.pull += Number(set.volumeKg);
    ratios.set(key, bucket);
  }
  const weeklyRatios = [...ratios.values()]
    .map((bucket) => (bucket.pull > 0 ? bucket.push / bucket.pull : bucket.push > 0 ? 2 : 0))
    .map((value) => Math.round(value * 100) / 100);
  const imbalance = evaluateImbalance({ weeklyPushPullRatios: weeklyRatios });
  if (imbalance) {
    raw.push({
      result: imbalance,
      programId: program?.id ?? null,
      context: {
        metric: "push_pull_ratio",
        value: weeklyRatios.at(-1) ?? 0,
        unit: "ratio",
        delta_pct: null,
        series: weeklyRatios.map((value, index) => ({ week_index: index + 1, ratio: value }))
      }
    });
  }

  const exerciseSets = await prisma.workoutSet.findMany({
    where: {
      userId: options.userId,
      isCompleted: true,
      isWarmup: false,
      deletedAt: null,
      est1rmKg: { not: null },
      createdAt: { gte: new Date(now.getTime() - 30 * DAY_MS) },
      workout: { status: "finished", deletedAt: null }
    },
    select: { exerciseId: true, est1rmKg: true, createdAt: true }
  });
  const byExercise = new Map<string, Array<{ at: number; value: number }>>();
  for (const set of exerciseSets) {
    if (set.est1rmKg === null) continue;
    const rows = byExercise.get(set.exerciseId) ?? [];
    rows.push({ at: set.createdAt.getTime(), value: Number(set.est1rmKg) });
    byExercise.set(set.exerciseId, rows);
  }
  for (const [exerciseId, rows] of byExercise) {
    const byWorkout = new Map<number, number>();
    for (const row of rows) {
      const day = Math.floor(row.at / DAY_MS);
      byWorkout.set(day, Math.max(byWorkout.get(day) ?? 0, row.value));
    }
    const values = [...byWorkout.entries()]
      .sort(([a], [b]) => a - b)
      .map(([, value]) => value)
      .slice(-3);
    const plateau = evaluatePlateau({
      estimatedOneRm: values,
      plannedSets: 3,
      completedSets: 3
    });
    if (plateau) {
      raw.push({
        result: plateau,
        exerciseId,
        context: {
          metric: "estimated_1rm_range",
          value: (plateau.evidence.range_pct as number | undefined) ?? 0,
          unit: "%",
          delta_pct: (plateau.evidence.range_pct as number | undefined) ?? 0,
          series: values.map((value, index) => ({ set: index + 1, est_1rm_kg: value }))
        }
      });
      break;
    }
  }

  const languageCandidates = candidatesFor(raw, language)
    .filter((candidate) => !blockedRules.has(candidate.result.rule))
    .sort(
      (a, b) =>
        (SEVERITY_ORDER[a.result.severity] ?? 9) -
          (SEVERITY_ORDER[b.result.severity] ?? 9) ||
        a.result.rule.localeCompare(b.result.rule)
    );

  const created: string[] = [];
  for (const candidate of languageCandidates.slice(0, 3)) {
    const recommendation = await prisma.aiRecommendation.create({
      data: {
        id: newId("rec"),
        userId: options.userId,
        rule: candidate.result.rule,
        severity: candidate.result.severity,
        title: candidate.title,
        body: candidate.body,
        evidence: candidate.evidence as Prisma.InputJsonValue,
        actionType: candidate.actionType,
        actionPayload: (candidate.actionPayload ?? undefined) as Prisma.InputJsonValue | undefined,
        relatedProgramId: candidate.relatedProgramId ?? null,
        relatedExerciseId: candidate.relatedExerciseId ?? null,
        expiresAt: new Date(now.getTime() + 30 * DAY_MS),
        status: "new"
      }
    });
    created.push(recommendation.id);

    await prisma.notification.create({
      data: {
        id: newId("ntf"),
        userId: options.userId,
        type: "recommendation",
        title: candidate.title,
        body: candidate.body.slice(0, 240),
        link: `/recommendations?id=${recommendation.id}`
      }
    });

    if (narratorAiConfig().enabled) {
      await narrate(recommendation.id, language);
    }
  }

  if (options.triggerWorkoutId) {
    log("info", "recommendations_evaluated", {
      user_id: options.userId,
      workout_id: options.triggerWorkoutId,
      created: created.length
    });
  }

  return created;
}

async function narrate(recommendationId: string, language: "id" | "en") {
  const config = narratorAiConfig();
  if (!config.enabled) return;
  const [row, prompt] = await Promise.all([
    prisma.aiRecommendation.findUnique({ where: { id: recommendationId } }),
    prisma.promptVersion.findFirst({
      where: { name: "recommendation_narrator", isActive: true },
      orderBy: { version: "desc" }
    })
  ]);
  if (!row || !prompt) return;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  const startedAt = Date.now();
  try {
    const response = await fetch(
      config.baseUrl.endsWith("/v1")
        ? `${config.baseUrl}/chat/completions`
        : `${config.baseUrl}/v1/chat/completions`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.fastModel,
          max_tokens: 180,
          temperature: 0.3,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: prompt.template },
            {
              role: "user",
              content: JSON.stringify({
                rule: row.rule,
                severity: row.severity,
                evidence: row.evidence,
                language
              })
            }
          ]
        }),
        signal: controller.signal
      }
    );
    clearTimeout(timer);
    if (!response.ok) return;
    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    const text = payload.choices?.[0]?.message?.content?.trim();
    if (!text) return;
    const parsed = JSON.parse(text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim()) as {
      title?: unknown;
      body?: unknown;
    };
    const title = typeof parsed.title === "string" ? parsed.title.slice(0, 160) : row.title;
    const body = typeof parsed.body === "string" ? parsed.body.slice(0, 500) : row.body;
    if (!body) return;

    const inputTokens = Number(payload.usage?.prompt_tokens) || 0;
    const outputTokens = Number(payload.usage?.completion_tokens) || 0;
    await prisma.$transaction([
      prisma.aiRecommendation.update({
        where: { id: row.id },
        data: { title, body, evidence: row.evidence as Prisma.InputJsonValue }
      }),
      prisma.aiGeneration.create({
        data: {
          id: newId("aig"),
          userId: row.userId,
          type: "narrative",
          model: config.fastModel,
          promptVersionId: prompt.id,
          status: "succeeded",
          inputTokens,
          outputTokens,
          costUsd: computeCostUsd(inputTokens, outputTokens, "fast"),
          latencyMs: Date.now() - startedAt,
          completedAt: new Date(),
          metadata: { recommendation_id: row.id } as Prisma.InputJsonValue
        }
      })
    ]);
  } catch {
    // Template fallback is already persisted; never fail workout completion for narration.
  } finally {
    clearTimeout(timer);
  }
}
