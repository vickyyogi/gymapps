import "server-only";

import { prisma, Prisma } from "@gymapps/db";
import {
  checkQuota,
  generateFallbackProgram,
  validateProgram,
  type BodyArea,
  type EquipmentType,
  type ExerciseMeta,
  type Program,
  type ValidationIssue
} from "@gymapps/domain";
import { track } from "@/lib/analytics";
import { ApiError, ValidationError } from "@/lib/api/errors";
import {
  generateShapeError,
  type ProgramGenerateInput
} from "@/lib/api/phase5-validation";
import { newId } from "@/lib/id";
import { log } from "@/lib/log";
import { AiClientError, callProgramModel } from "./client";
import { programAiConfig } from "./config";
import { buildProgramContext } from "./context";
import { normalizeEmitProgram, parseEmitProgram, type NormalizedProgram } from "./schema";

const DAY_MS = 24 * 60 * 60 * 1000;
type Step = "analyzing_profile" | "drafting_program" | "validating" | "finalizing";

type JobState = {
  status: "queued" | "running" | "succeeded" | "failed";
  current_step: Step;
  progress_pct: number;
  result?: {
    program_id: string;
    fallback_used: boolean;
    repair_attempts: number;
  };
  error?: { code: string; message: string };
};

type JobMetadata = {
  request?: ProgramGenerateInput;
  source_program_id?: string;
  job?: JobState;
  prompt_version_id?: string | null;
};

const GOAL_LABEL: Record<string, string> = {
  lose_weight: "Turun berat badan",
  gain_muscle: "Tambah otot",
  strength: "Kekuatan",
  endurance: "Daya tahan",
  general_fitness: "Kebugaran umum",
  body_recomposition: "Rekomposisi tubuh"
};

const SPLIT_LABEL: Record<string, string> = {
  full_body: "Full body",
  upper_lower: "Upper / lower",
  push_pull_legs: "Push / pull / legs",
  bro_split: "Bro split",
  custom: "Kustom"
};

function asMetadata(value: unknown): JobMetadata {
  return value && typeof value === "object" ? (value as JobMetadata) : {};
}

async function stateFor(jobId: string) {
  const row = await prisma.aiGeneration.findUniqueOrThrow({ where: { id: jobId } });
  return { row, metadata: asMetadata(row.metadata) };
}

async function setState(jobId: string, base: JobMetadata, state: Partial<JobState>) {
  const current = base.job ?? {
    status: "queued",
    current_step: "analyzing_profile",
    progress_pct: 0
  };
  const job = { ...current, ...state } as JobState;
  await prisma.aiGeneration.update({
    where: { id: jobId },
    data: { metadata: { ...base, job } as Prisma.InputJsonValue }
  });
}

export async function createProgramGenerationJob(options: {
  userId: string;
  input: ProgramGenerateInput;
  sourceProgramId?: string;
}) {
  const config = programAiConfig();
  if (!config.enabled) {
    throw new ApiError(
      503,
      "AI_UNAVAILABLE",
      "AI program generator is not configured"
    );
  }

  const shapeError = generateShapeError(options.input);
  if (shapeError) {
    throw new ValidationError([{ path: "days_per_week", message: shapeError }]);
  }

  const entitlement = await prisma.entitlement.findFirst({
    where: {
      userId: options.userId,
      OR: [{ validUntil: null }, { validUntil: { gt: new Date() } }]
    },
    orderBy: { validFrom: "desc" }
  });
  const limit = entitlement?.aiGenerateDailyLimit ?? 5;
  const since = new Date(Date.now() - DAY_MS);
  const usage = await prisma.aiGeneration.findMany({
    where: { userId: options.userId, type: "program", createdAt: { gte: since } },
    select: { createdAt: true }
  });
  const quota = checkQuota(
    usage.map((row) => row.createdAt.getTime()),
    { perDay: limit }
  );
  if (!quota.allowed) {
    throw new ApiError(429, "AI_QUOTA_EXCEEDED", "Daily AI program quota reached", {
      details: [
        {
          path: "quota",
          message: `Remaining: ${quota.remaining.day ?? 0}; retry after ${quota.retryAfterSeconds}s`
        }
      ],
      headers: { "Retry-After": String(Math.max(1, quota.retryAfterSeconds)) }
    });
  }

  const prompt = await prisma.promptVersion.findFirst({
    where: { name: "program_generator", isActive: true },
    orderBy: { version: "desc" }
  });
  const id = newId("aig");
  const metadata: JobMetadata = {
    request: options.input,
    source_program_id: options.sourceProgramId,
    prompt_version_id: prompt?.id ?? null,
    job: { status: "queued", current_step: "analyzing_profile", progress_pct: 0 }
  };

  await prisma.aiGeneration.create({
    data: {
      id,
      userId: options.userId,
      type: "program",
      model: config.mainModel,
      promptVersionId: prompt?.id ?? null,
      status: "pending",
      inputHash: null,
      metadata: metadata as Prisma.InputJsonValue
    }
  });

  return { id, status: "queued" as const };
}

export async function jobResponse(jobId: string, userId: string) {
  const job = await prisma.aiGeneration.findFirst({
    where: { id: jobId, userId, type: "program" }
  });
  if (!job) throw new ApiError(404, "NOT_FOUND", "AI job not found");

  const metadata = asMetadata(job.metadata);
  const state =
    metadata.job ??
    ({
      status:
        job.status === "pending"
          ? "queued"
          : job.status === "running"
            ? "running"
            : job.status === "failed"
              ? "failed"
              : "succeeded",
      current_step: "finalizing",
      progress_pct: job.status === "succeeded" || job.status === "fallback" ? 100 : 0
    } satisfies JobState);

  return {
    job_id: job.id,
    status: state.status,
    current_step: state.current_step,
    progress_pct: state.progress_pct,
    result: state.result
      ? {
          program_id: state.result.program_id,
          fallback_used: state.result.fallback_used,
          repair_attempts: state.result.repair_attempts
        }
      : null,
    error: state.error ? { error: state.error } : null
  };
}

function completenessIssues(program: Program, input: ProgramGenerateInput): ValidationIssue[] {
  const errors: ValidationIssue[] = [];
  if (program.weeks.length !== input.duration_weeks) {
    errors.push({
      rule: "V-01",
      path: "weeks",
      message: `Expected ${input.duration_weeks} weeks, got ${program.weeks.length}`
    });
  }
  program.weeks.forEach((week, index) => {
    if (week.weekNumber !== index + 1) {
      errors.push({
        rule: "V-01",
        path: `weeks[${index}].weekNumber`,
        message: `Expected week ${index + 1}`
      });
    }
    if (week.sessions.length !== input.days_per_week) {
      errors.push({
        rule: "V-01",
        path: `weeks[${index}].sessions`,
        message: `Expected ${input.days_per_week} sessions, got ${week.sessions.length}`
      });
    }
    const days = week.sessions.map((session) => session.dayIndex);
    if (new Set(days).size !== days.length) {
      errors.push({
        rule: "V-01",
        path: `weeks[${index}].sessions`,
        message: "day_index must be unique within a week"
      });
    }
  });
  return errors;
}

function schemaErrors(raw: unknown): ValidationIssue[] {
  const parsed = parseEmitProgram(raw);
  if (parsed.success) return [];
  return parsed.error.issues.map((issue) => ({
    rule: "V-01" as const,
    path: issue.path.join(".") || "program",
    message: issue.message
  }));
}

export async function runProgramGeneration(jobId: string) {
  const { row, metadata } = await stateFor(jobId);
  if (row.status !== "pending" && row.status !== "running") return;
  const input = metadata.request;
  if (!input) {
    await failJob(jobId, metadata, "INVALID_REQUEST", "Job request is missing");
    return;
  }

  await prisma.aiGeneration.update({
    where: { id: jobId },
    data: { status: "running" }
  });
  await setState(jobId, metadata, {
    status: "running",
    current_step: "analyzing_profile",
    progress_pct: 10
  });

  try {
    const built = await buildProgramContext(row.userId, input);
    const generator = await prisma.promptVersion.findFirst({
      where: { name: "program_generator", isActive: true },
      orderBy: { version: "desc" }
    });
    const repair = await prisma.promptVersion.findFirst({
      where: { name: "repair_pass", isActive: true },
      orderBy: { version: "desc" }
    });

    let normalized: NormalizedProgram | null = null;
    let previous: unknown = null;
    let errors: ValidationIssue[] = [];
    let repairAttempts = 0;
    let inputTokens = 0;
    let outputTokens = 0;
    let costUsd = 0;
    let latencyMs = 0;
    let retryCount = 0;
    let model = generator?.model ?? programAiConfig().mainModel;
    let errorCode: string | null = null;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      if (!generator) {
        errorCode = "prompt_missing";
        break;
      }

      await setState(jobId, metadata, {
        status: "running",
        current_step: attempt === 0 ? "drafting_program" : "validating",
        progress_pct: attempt === 0 ? 30 : 65
      });

      const params = (generator.parameters ?? {}) as {
        max_tokens?: number;
        temperature?: number;
        top_p?: number;
      };
      const repairParams = (repair?.parameters ?? params) as typeof params;

      try {
        const result = await callProgramModel({
          system: attempt === 0 ? generator.template : (repair?.template ?? generator.template),
          context: built.context,
          repair:
            attempt === 0
              ? undefined
              : { previous, errors },
          maxTokens: Number((attempt === 0 ? params : repairParams).max_tokens) || 6_000,
          temperature:
            Number((attempt === 0 ? params : repairParams).temperature) ||
            (attempt === 0 ? 0.4 : 0.1),
          topP: Number((attempt === 0 ? params : repairParams).top_p) || 0.9
        });

        inputTokens += result.inputTokens;
        outputTokens += result.outputTokens;
        costUsd += result.costUsd;
        latencyMs += result.latencyMs;
        retryCount += result.retryCount;
        model = result.model;
        previous = result.raw;

        const parsed = parseEmitProgram(result.raw);
        if (!parsed.success) {
          errors = schemaErrors(result.raw);
          log("warn", "ai_program_schema_invalid", { job_id: jobId, attempt, errors });
          if (attempt === 0) {
            repairAttempts = 1;
            continue;
          }
          break;
        }

        const candidate = normalizeEmitProgram(parsed.data, {
          splitType: input.split_type,
          daysPerWeek: input.days_per_week,
          durationWeeks: input.duration_weeks,
          sessionMinutes: input.session_minutes ?? 60
        });
        const complete = completenessIssues(candidate.program, input);
        const validation = validateProgram(candidate.program, {
          catalog: built.catalog as ExerciseMeta[],
          availableEquipment: built.availableEquipment as EquipmentType[],
          injuries: built.injuries as BodyArea[],
          isStrength: true
        });
        if (complete.length === 0 && validation.valid) {
          normalized = candidate;
          break;
        }

        errors = [...complete, ...validation.errors];
        log("warn", "ai_program_domain_invalid", { job_id: jobId, attempt, errors });
        if (attempt === 0) {
          repairAttempts = 1;
          continue;
        }
      } catch (error) {
        if (error instanceof AiClientError) {
          errorCode = error.code;
          retryCount += error.retries;
          if (error.code === "invalid_output" && attempt === 0) {
            errors = [
              {
                rule: "V-01",
                path: "program",
                message: error.message
              }
            ];
            repairAttempts = 1;
            continue;
          }
          latencyMs += 0;
          break;
        }
        throw error;
      }
    }

    let fallbackUsed = false;
    let program = normalized?.program;
    let rationale = normalized?.rationale;
    let assumptions = normalized?.assumptions ?? [];
    let safetyNotes = normalized?.safetyNotes ?? [];

    if (!program) {
      fallbackUsed = true;
      errorCode ??= "invalid_output";
      const fallback = generateFallbackProgram({
        splitType: input.split_type,
        daysPerWeek: input.days_per_week,
        durationWeeks: input.duration_weeks,
        sessionMinutes: input.session_minutes ?? 60,
        availableEquipment: built.availableEquipment as EquipmentType[],
        injuries: built.injuries as BodyArea[],
        catalog: built.fallbackCatalog
      });
      const fallbackValidation = validateProgram(fallback, {
        catalog: built.fallbackCatalog as ExerciseMeta[],
        availableEquipment: built.availableEquipment as EquipmentType[],
        injuries: built.injuries as BodyArea[],
        isStrength: true
      });
      if (!fallbackValidation.valid) {
        throw new Error(
          `Fallback program failed validation: ${fallbackValidation.errors
            .map((issue) => `${issue.rule} ${issue.path}: ${issue.message}`)
            .join("; ")}`
        );
      }
      program = fallback;
      rationale =
        "Program ini dibuat oleh generator rule-based karena output AI tidak lolos validasi. " +
        "Beban, volume, dan pemulihan mengikuti template aman dan dapat diubah sebelum diaktifkan.";
      assumptions = ["Semua beban awal perlu disesuaikan dengan kemampuan user."];
      safetyNotes = built.injuries.length
        ? [
            `Exercise yang membebani area berikut dihindari: ${built.injuries.join(", ")}.`,
            "Hentikan latihan bila nyeri bertambah dan konsultasikan ke profesional."
          ]
        : ["Hentikan latihan bila nyeri bertambah dan konsultasikan ke profesional."];
    }

    await setState(jobId, metadata, {
      status: "running",
      current_step: "finalizing",
      progress_pct: 90
    });

    const programId = newId("prg");
    const programName = (
      normalized?.name ??
      `${GOAL_LABEL[input.goal] ?? "Program"} · ${SPLIT_LABEL[input.split_type] ?? "Custom"}`
    ).slice(0, 80);
    const aiRationale = {
      summary: (rationale ?? "").slice(0, 1200),
      assumptions: assumptions.slice(0, 8),
      safety_notes: safetyNotes.slice(0, 8),
      fallback_used: fallbackUsed,
      repair_attempts: repairAttempts,
      model,
      prompt_version_id: generator?.id ?? null,
      error_code: errorCode
    };

    await persistProgram({
      programId,
      userId: row.userId,
      input,
      name: programName,
      program,
      rationale: aiRationale
    });

    const status = fallbackUsed ? "fallback" : "succeeded";
    await prisma.aiGeneration.update({
      where: { id: jobId },
      data: {
        status,
        programId,
        inputHash: built.inputHash,
        inputTokens,
        outputTokens,
        costUsd,
        latencyMs,
        errorCode,
        retryCount,
        fallbackUsed,
        completedAt: new Date(),
        metadata: {
          ...metadata,
          prompt_version_id: generator?.id ?? null,
          job: {
            status: "succeeded",
            current_step: "finalizing",
            progress_pct: 100,
            result: {
              program_id: programId,
              fallback_used: fallbackUsed,
              repair_attempts: repairAttempts
            }
          }
        } as Prisma.InputJsonValue
      }
    });
    track("ai_generation_finished", row.userId, {
      status,
      model,
      cost_usd: costUsd,
      latency_ms: latencyMs,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      fallback_used: fallbackUsed,
      repair_attempts: repairAttempts,
      error_code: errorCode
    });
  } catch (error) {
    log("error", "ai_program_generation_failed", { job_id: jobId, error });
    const metadataNow = asMetadata((await prisma.aiGeneration.findUnique({ where: { id: jobId } }))?.metadata);
    await failJob(jobId, metadataNow, "AI_GENERATION_FAILED", "AI program generation failed");
  }
}

async function failJob(
  jobId: string,
  metadata: JobMetadata,
  code: string,
  message: string
) {
  await prisma.aiGeneration.update({
    where: { id: jobId },
    data: {
      status: "failed",
      errorCode: code,
      completedAt: new Date(),
      metadata: {
        ...metadata,
        job: {
          status: "failed",
          current_step: "finalizing",
          progress_pct: 100,
          error: { code, message }
        }
      } as Prisma.InputJsonValue
    }
  });
}

async function persistProgram(options: {
  programId: string;
  userId: string;
  input: ProgramGenerateInput;
  name: string;
  program: Program;
  rationale: Record<string, unknown>;
}) {
  const { programId, userId, input, name, program, rationale } = options;

  await prisma.$transaction(async (tx) => {
    await tx.program.create({
      data: {
        id: programId,
        userId,
        name,
        description: String(rationale.summary ?? "").slice(0, 1000),
        status: "draft",
        source: "ai",
        goal: input.goal,
        splitType: input.split_type,
        durationWeeks: input.duration_weeks,
        daysPerWeek: input.days_per_week,
        sessionMinutes: input.session_minutes ?? 60,
        progressionType: program.progressionType,
        aiGenerated: true,
        aiRationale: rationale as Prisma.InputJsonValue
      }
    });

    for (const week of program.weeks) {
      const weekId = newId("pwk");
      await tx.programWeek.create({
        data: {
          id: weekId,
          programId,
          weekNumber: week.weekNumber,
          focusNote: (week as { focusNote?: string }).focusNote ?? null,
          isDeload: week.isDeload ?? false,
          volumeMultiplier: week.volumeMultiplier ?? 1
        }
      });

      for (const session of week.sessions) {
        const sessionId = newId("pss");
        await tx.programSession.create({
          data: {
            id: sessionId,
            programId,
            programWeekId: weekId,
            dayIndex: session.dayIndex,
            name: session.name,
            notes: session.focus,
            estimatedMinutes: session.estimatedMinutes ?? null
          }
        });

        if (session.exercises.length === 0) continue;
        await tx.programExercise.createMany({
          data: session.exercises
            .slice()
            .sort((a, b) => a.position - b.position)
            .map((exercise) => ({
              id: newId("pex"),
              programSessionId: sessionId,
              exerciseId: exercise.exerciseId,
              position: exercise.position,
              targetSets: exercise.targetSets,
              targetRepsMin: exercise.targetRepsMin,
              targetRepsMax: exercise.targetRepsMax,
              targetRpe: exercise.targetRpe ?? null,
              restSeconds: exercise.restSeconds,
              tempo: null,
              isWarmup: exercise.isWarmup ?? false,
              supersetGroup: exercise.supersetGroup ?? null,
              notes: null,
              progression: exercise.progression as Prisma.InputJsonValue,
              aiGenerated: true
            }))
        });
      }
    }
  });
}
