import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { stat } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@gymapps/db";
import { newId } from "@/lib/id";
import { log } from "@/lib/log";

export const EXPORT_TTL_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;
export const ALL_ENTITIES = [
  "workouts",
  "sets",
  "programs",
  "body_metrics",
  "notes",
  "exercises"
] as const;

type Entity = (typeof ALL_ENTITIES)[number];

function exportDir() {
  return process.env.EXPORT_DIR || path.join(process.cwd(), ".exports");
}

function signingSecret() {
  return (
    process.env.EXPORT_SIGNING_SECRET ||
    process.env.AUTH_SECRET ||
    "gymapps-development-export-secret"
  );
}

export function exportSignature(exportId: string, userId: string, expiresAt: Date) {
  return createHmac("sha256", signingSecret())
    .update(`${exportId}:${userId}:${expiresAt.getTime()}`)
    .digest("base64url");
}

export function verifyExportSignature(
  exportId: string,
  userId: string,
  expiresAt: Date,
  token: string
) {
  const expected = exportSignature(exportId, userId, expiresAt);
  const left = Buffer.from(expected);
  const right = Buffer.from(token);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function downloadPath(exportId: string, token: string) {
  return `/api/v1/exports/${exportId}/download?token=${encodeURIComponent(token)}`;
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function num(value: { toString(): string } | number | null) {
  return value === null ? null : Number(value);
}

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function periodFilter(from?: Date, to?: Date) {
  return {
    ...(from ? { gte: from } : {}),
    ...(to ? { lte: to } : {})
  };
}

export async function createExportJob(options: {
  userId: string;
  format: "csv" | "json";
  entities?: Entity[];
  from?: Date;
  to?: Date;
}) {
  const row = await prisma.export.create({
    data: {
      id: newId("exp"),
      userId: options.userId,
      type: options.format,
      status: "queued",
      entities: options.entities ?? [...ALL_ENTITIES],
      periodStart: options.from ?? null,
      periodEnd: options.to ?? null
    }
  });
  return row;
}

export async function runExport(exportId: string) {
  const row = await prisma.export.findUnique({ where: { id: exportId } });
  if (!row || row.status === "ready") return;

  await prisma.export.update({
    where: { id: row.id },
    data: { status: "running" }
  });

  try {
    const entities = new Set<Entity>(row.entities as Entity[]);
    const from = row.periodStart ?? undefined;
    const to = row.periodEnd ?? undefined;
    const dateFilter = periodFilter(from, to);

    const [workouts, programs, bodyMetrics, notes, exercises] = await Promise.all([
      entities.has("workouts") || entities.has("sets")
        ? prisma.workout.findMany({
            where: {
              userId: row.userId,
              deletedAt: null,
              ...(from || to ? { startedAt: dateFilter } : {})
            },
            orderBy: { startedAt: "asc" },
            include: {
              exercises: {
                orderBy: { position: "asc" },
                include: {
                  exercise: { select: { nameId: true, nameEn: true } },
                  sets: {
                    where: { deletedAt: null },
                    orderBy: { setNumber: "asc" }
                  }
                }
              }
            }
          })
        : Promise.resolve([]),
      entities.has("programs")
        ? prisma.program.findMany({
            where: {
              userId: row.userId,
              deletedAt: null,
              ...(from || to ? { createdAt: dateFilter } : {})
            },
            orderBy: { createdAt: "asc" },
            include: {
              weeks: {
                orderBy: { weekNumber: "asc" },
                include: {
                  sessions: {
                    orderBy: { dayIndex: "asc" },
                    include: {
                      exercises: {
                        orderBy: { position: "asc" },
                        include: { exercise: { select: { nameId: true, nameEn: true } } }
                      }
                    }
                  }
                }
              }
            }
          })
        : Promise.resolve([]),
      entities.has("body_metrics")
        ? prisma.bodyMetric.findMany({
            where: {
              userId: row.userId,
              deletedAt: null,
              ...(from || to ? { recordedOn: dateFilter } : {})
            },
            orderBy: { recordedOn: "asc" }
          })
        : Promise.resolve([]),
      entities.has("notes")
        ? prisma.note.findMany({
            where: {
              userId: row.userId,
              deletedAt: null,
              ...(from || to ? { createdAt: dateFilter } : {})
            },
            orderBy: { createdAt: "asc" }
          })
        : Promise.resolve([]),
      entities.has("exercises")
        ? prisma.exercise.findMany({
            where: { ownerUserId: row.userId, deletedAt: null },
            orderBy: { createdAt: "asc" }
          })
        : Promise.resolve([])
    ]);

    const workoutRows = workouts.map((workout) => ({
      id: workout.id,
      program_id: workout.programId,
      program_session_id: workout.programSessionId,
      title: workout.title,
      status: workout.status,
      started_at: workout.startedAt.toISOString(),
      ended_at: workout.endedAt?.toISOString() ?? null,
      duration_seconds: workout.durationSeconds,
      notes: workout.notes,
      bodyweight_kg: num(workout.bodyweightKg),
      session_rpe: num(workout.sessionRpe),
      total_volume_kg: num(workout.totalVolumeKg),
      total_sets: workout.totalSets,
      total_reps: workout.totalReps,
      exercises: workout.exercises.map((item) => ({
        name_id: item.exercise.nameId,
        name_en: item.exercise.nameEn,
        position: item.position,
        sets: item.sets.map((set) => ({
          set_number: set.setNumber,
          weight_kg: num(set.weightKg),
          reps: set.reps,
          rpe: num(set.rpe),
          is_warmup: set.isWarmup,
          is_completed: set.isCompleted,
          is_pr: set.isPr,
          est_1rm_kg: num(set.est1rmKg),
          volume_kg: num(set.volumeKg)
        }))
      }))
    }));

    const setRows = workouts.flatMap((workout) =>
      workout.exercises.flatMap((item) =>
        item.sets.map((set) => ({
          id: set.id,
          workout_id: workout.id,
          exercise_name_id: item.exercise.nameId,
          exercise_name_en: item.exercise.nameEn,
          set_number: set.setNumber,
          weight_kg: num(set.weightKg),
          reps: set.reps,
          rpe: num(set.rpe),
          is_warmup: set.isWarmup,
          is_completed: set.isCompleted,
          is_pr: set.isPr,
          est_1rm_kg: num(set.est1rmKg),
          volume_kg: num(set.volumeKg),
          created_at: set.createdAt.toISOString()
        }))
      )
    );

    const programRows = programs.map((program) => ({
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
      ai_generated: program.aiGenerated,
      ai_rationale: program.aiRationale,
      created_at: program.createdAt.toISOString(),
      weeks: program.weeks.map((week) => ({
        week_number: week.weekNumber,
        is_deload: week.isDeload,
        focus_note: week.focusNote,
        sessions: week.sessions.map((session) => ({
          day_index: session.dayIndex,
          name: session.name,
          completed_at: session.completedAt?.toISOString() ?? null,
          exercises: session.exercises.map((item) => ({
            exercise_id: item.exerciseId,
            exercise_name: item.exercise.nameId,
            position: item.position,
            target_sets: item.targetSets,
            target_reps_min: item.targetRepsMin,
            target_reps_max: item.targetRepsMax,
            rest_seconds: item.restSeconds
          }))
        }))
      }))
    }));

    const metricRows = bodyMetrics.map((metric) => ({
      id: metric.id,
      recorded_on: isoDate(metric.recordedOn),
      weight_kg: num(metric.weightKg),
      body_fat_pct: num(metric.bodyFatPct),
      chest_cm: num(metric.chestCm),
      waist_cm: num(metric.waistCm),
      hip_cm: num(metric.hipCm),
      arm_cm: num(metric.armCm),
      thigh_cm: num(metric.thighCm),
      calf_cm: num(metric.calfCm),
      shoulder_cm: num(metric.shoulderCm),
      notes: metric.notes,
      created_at: metric.createdAt.toISOString()
    }));

    const noteRows = notes.map((note) => ({
      id: note.id,
      workout_id: note.workoutId,
      category: note.category,
      body: note.body,
      is_pinned: note.isPinned,
      created_at: note.createdAt.toISOString()
    }));

    const exerciseRows = exercises.map((exercise) => ({
      id: exercise.id,
      name_id: exercise.nameId,
      name_en: exercise.nameEn,
      primary_muscle: exercise.primaryMuscle,
      secondary_muscles: exercise.secondaryMuscles,
      equipment: exercise.equipment,
      difficulty: exercise.difficulty,
      instructions_id: exercise.instructionsId,
      instructions_en: exercise.instructionsEn,
      status: exercise.status
    }));

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: row.userId },
      select: { id: true, email: true, displayName: true, locale: true }
    });

    let content: string;
    let extension: string;
    if (row.type === "json") {
      content = JSON.stringify(
        {
          exported_at: new Date().toISOString(),
          user,
          workouts: entities.has("workouts") ? workoutRows : undefined,
          sets: entities.has("sets") ? setRows : undefined,
          programs: entities.has("programs") ? programRows : undefined,
          body_metrics: entities.has("body_metrics") ? metricRows : undefined,
          notes: entities.has("notes") ? noteRows : undefined,
          exercises: entities.has("exercises") ? exerciseRows : undefined
        },
        null,
        2
      );
      extension = "json";
    } else {
      const rows: Array<[string, unknown]> = [
        ...workoutRows.map((item) => ["workouts", item] as [string, unknown]),
        ...setRows.map((item) => ["sets", item] as [string, unknown]),
        ...programRows.map((item) => ["programs", item] as [string, unknown]),
        ...metricRows.map((item) => ["body_metrics", item] as [string, unknown]),
        ...noteRows.map((item) => ["notes", item] as [string, unknown]),
        ...exerciseRows.map((item) => ["exercises", item] as [string, unknown])
      ];
      content = [
        "entity,id,payload,date,exercise,weight_kg,reps,volume_kg",
        ...rows.map(([entity, item]) => {
          const record = item as Record<string, unknown>;
          const id = String(record.id ?? "");
          const date = String(record.created_at ?? record.started_at ?? record.recorded_on ?? "");
          const exercise = String(record.exercise_name_id ?? record.exercise_name ?? record.name_id ?? record.name ?? "");
          const weightKg = record.weight_kg !== undefined && record.weight_kg !== null ? String(record.weight_kg) : "";
          const reps = record.reps !== undefined && record.reps !== null ? String(record.reps) : "";
          const volumeKg = record.volume_kg !== undefined && record.volume_kg !== null ? String(record.volume_kg) : "";
          return [
            csvCell(entity),
            csvCell(id),
            csvCell(JSON.stringify(item)),
            csvCell(date),
            csvCell(exercise),
            csvCell(weightKg),
            csvCell(reps),
            csvCell(volumeKg)
          ].join(",");
        })
      ].join("\n");
      extension = "csv";
    }

    await mkdir(exportDir(), { recursive: true });
    const filePath = path.join(exportDir(), `${row.id}.${extension}`);
    await writeFile(filePath, content, "utf8");
    const size = (await stat(filePath)).size;
    const expiresAt = new Date(Date.now() + EXPORT_TTL_DAYS * DAY_MS);

    await prisma.$transaction([
      prisma.export.update({
        where: { id: row.id },
        data: {
          status: "ready",
          filePath,
          fileSizeBytes: size,
          expiresAt,
          errorMessage: null
        }
      }),
      prisma.notification.create({
        data: {
          id: newId("ntf"),
          userId: row.userId,
          type: "export",
          title:
            user.locale === "en"
              ? `${row.type === "json" ? "JSON" : "CSV"} export is ready`
              : `Export ${row.type === "json" ? "JSON" : "CSV"} siap`,
          body:
            user.locale === "en"
              ? "The download link is valid for 7 days."
              : "Link download berlaku 7 hari.",
          link: "/exports"
        }
      })
    ]);
  } catch (error) {
    log("error", "export_failed", { export_id: row.id, error });
    await prisma.export.update({
      where: { id: row.id },
      data: {
        status: "failed",
        errorMessage: "Export failed"
      }
    });
  }
}

export async function deleteExportFile(row: { filePath: string | null }) {
  if (!row.filePath) return;
  await rm(row.filePath, { force: true });
}

export async function exportStatus(row: {
  id: string;
  userId: string;
  status: string;
  fileSizeBytes: number | null;
  expiresAt: Date | null;
  type: string;
  errorMessage: string | null;
}) {
  const expired = Boolean(row.expiresAt && row.expiresAt.getTime() <= Date.now());
  const token =
    row.status === "ready" && !expired && row.expiresAt
      ? exportSignature(row.id, row.userId, row.expiresAt)
      : null;
  return {
    export_id: row.id,
    status: row.status,
    download_url: token ? downloadPath(row.id, token) : null,
    expires_at: row.expiresAt?.toISOString() ?? null,
    file_size_bytes: row.fileSizeBytes,
    expired,
    error_message: row.errorMessage
  };
}
