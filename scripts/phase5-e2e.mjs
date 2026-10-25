import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createPrisma } from "./prisma-client.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.PHASE5_PORT) || 3105;
const mockPort = Number(process.env.MOCK_AI_PORT) || 3199;
const APP = `http://127.0.0.1:${port}`;
const API = `${APP}/api/v1`;
const prisma = createPrisma();
const stamp = Date.now();
const email = `phase5-${stamp}@example.com`;
const otherEmail = `phase5-other-${stamp}@example.com`;
const password = "Password123!";
const children = [];

function start(command, args, options) {
  const child = spawn(command, args, {
    cwd: options.cwd ?? root,
    env: { ...process.env, ...options.env },
    stdio: ["ignore", "pipe", "pipe"]
  });
  const logs = [];
  child.stdout.on("data", (chunk) => logs.push(chunk.toString()));
  child.stderr.on("data", (chunk) => logs.push(chunk.toString()));
  child.on("exit", (code) => {
    if (code && !options.allowExit) {
      console.error(`${options.name} exited ${code}\n${logs.join("")}`);
    }
  });
  children.push({ child, name: options.name, logs });
  return child;
}

async function waitFor(url, timeoutMs = 90_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function call(path, options = {}, cookie) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(cookie ? { cookie } : {}),
      ...(options.headers ?? {})
    }
  });
  const text = await response.text();
  return { response, body: text ? JSON.parse(text) : null };
}

async function ok(path, options, cookie) {
  const result = await call(path, options, cookie);
  assert.ok(
    result.response.status >= 200 && result.response.status < 300,
    `${options?.method ?? "GET"} ${path} -> ${result.response.status}: ${JSON.stringify(result.body)}`
  );
  return result.body;
}

async function register(value) {
  const result = await call("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email: value, password, locale: "id" })
  });
  assert.equal(result.response.status, 201, JSON.stringify(result.body));
  const cookie = result.response.headers.get("set-cookie");
  assert.ok(cookie);
  return { cookie: cookie.split(";")[0], user: result.body.data.user };
}

async function waitJob(cookie, jobId, timeoutMs = 60_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const job = (await ok(`/ai/jobs/${jobId}`, {}, cookie)).data;
    if (job.status === "succeeded" || job.status === "failed") return job;
    await new Promise((resolve) => setTimeout(resolve, 700));
  }
  throw new Error(`Timed out waiting for AI job ${jobId}`);
}

async function generate(cookie, body) {
  const created = await ok("/ai/programs/generate", {
    method: "POST",
    body: JSON.stringify(body)
  }, cookie);
  assert.ok(created.data.job_id);
  return created.data.job_id;
}

async function assertBodyweightKneeSafe(programId, cookie) {
  const program = (await ok(`/programs/${programId}`, {}, cookie)).data;
  assert.equal(program.status, "draft");
  assert.equal(program.source, "ai");
  assert.equal(program.ai_generated, true);
  assert.ok(program.ai_rationale?.summary);

  const ids = [
    ...new Set(
      program.weeks.flatMap((week) =>
        week.sessions.flatMap((session) => session.exercises.map((exercise) => exercise.exercise_id))
      )
    )
  ];
  const exercises = await prisma.exercise.findMany({ where: { id: { in: ids } } });
  assert.equal(exercises.length, ids.length);
  for (const exercise of exercises) {
    assert.deepEqual(exercise.equipment, ["bodyweight"], `${exercise.id} equipment`);
    assert.ok(!exercise.contraindicatedAreas.includes("knee"), `${exercise.id} knee conflict`);
  }
  return program;
}

function assertSessionCount(program, days) {
  for (const week of program.weeks) {
    assert.equal(week.sessions.length, days, `week ${week.week_number} session count`);
    assert.equal(new Set(week.sessions.map((session) => session.day_index)).size, days);
  }
}

async function main() {
  start(process.execPath, [requireTsx(), "scripts/mock-ai.mjs"], {
    name: "mock-ai",
    env: { MOCK_AI_PORT: String(mockPort) }
  });
  start(process.execPath, [join(root, "node_modules/next/dist/bin/next"), "dev", "-p", String(port)], {
    name: "next",
    cwd: join(root, "apps/web"),
    env: {
      AI_ENABLED: "true",
      AI_PROGRAM_ENABLED: "true",
      OPENCODE_GO_API_KEY: "mock-key",
      OPENCODE_GO_BASE_URL: `http://127.0.0.1:${mockPort}/v1`,
      OPENCODE_GO_MODEL_MAIN: "mock-main",
      OPENCODE_GO_MODEL_FAST: "mock-fast",
      OPENCODE_GO_PRICE_MAIN_IN: "1",
      OPENCODE_GO_PRICE_MAIN_OUT: "2",
      OPENCODE_GO_PRICE_FAST_IN: "1",
      OPENCODE_GO_PRICE_FAST_OUT: "2",
      OPENCODE_GO_TIMEOUT_MS: "800"
    }
  });

  await waitFor(`http://127.0.0.1:${mockPort}/health`);
  await waitFor(`${API}/health`);

  await fetch(`http://127.0.0.1:${mockPort}/reset`, { method: "POST" });

  const owner = await register(email);
  const other = await register(otherEmail);
  await prisma.user.update({ where: { id: owner.user.id }, data: { displayName: "Budi Phase5" } });

  await ok("/profile", {
    method: "PATCH",
    body: JSON.stringify({
      goals: ["gain_muscle"],
      experience_level: "intermediate",
      days_per_week: 3,
      session_minutes: 60,
      equipment: ["bodyweight"],
      injury_areas: ["knee"],
      injury_notes:
        "Nyeri lutut saat squat dalam. Hubungi budi@example.com atau 081234567890. Nama Budi Phase5."
    })
  }, owner.cookie);

  const request = {
    goal: "gain_muscle",
    split_type: "push_pull_legs",
    duration_weeks: 2,
    days_per_week: 3,
    session_minutes: 60,
    notes: "MODE_VALID"
  };

  const validJobId = await generate(owner.cookie, request);
  const validJob = await waitJob(owner.cookie, validJobId);
  assert.equal(validJob.status, "succeeded", JSON.stringify(validJob));
  assert.equal(validJob.result.fallback_used, false, JSON.stringify(validJob));
  assert.equal(validJob.result.repair_attempts, 0);
  assert.equal(validJob.progress_pct, 100);

  const validProgram = await assertBodyweightKneeSafe(validJob.result.program_id, owner.cookie);
  assertSessionCount(validProgram, 3);
  assert.equal(validProgram.weeks.length, 2);
  assert.ok(validProgram.ai_rationale.safety_notes.join(" ").includes("knee"));

  const validGeneration = await prisma.aiGeneration.findUniqueOrThrow({ where: { id: validJobId } });
  assert.equal(validGeneration.status, "succeeded");
  assert.equal(validGeneration.fallbackUsed, false);
  assert.ok(validGeneration.inputTokens > 0);
  assert.ok(validGeneration.outputTokens > 0);
  assert.ok(Number(validGeneration.costUsd) > 0);
  assert.ok(validGeneration.latencyMs > 0);
  assert.ok(validGeneration.promptVersionId);

  const contextResponse = await fetch(`http://127.0.0.1:${mockPort}/requests`).then((item) => item.json());
  const sentContext = contextResponse.data[0];
  assert.ok(sentContext);
  const sentText = JSON.stringify(sentContext);
  assert.ok(!sentText.includes(email));
  assert.ok(!sentText.includes("budi@example.com"));
  assert.ok(!sentText.includes("081234567890"));
  assert.ok(!sentText.includes("Budi Phase5"));
  assert.ok(!sentText.includes("usr_"));
  assert.ok(sentText.length / 4 <= 5_000, `context tokens ${Math.ceil(sentText.length / 4)}`);
  assert.ok(
    sentContext.available_exercises.every((exercise) =>
      exercise.equipment.every((equipment) => equipment === "bodyweight")
    )
  );
  assert.ok(
    sentContext.available_exercises.every((exercise) => exercise.name && exercise.id)
  );

  const rateJobId = await generate(owner.cookie, { ...request, notes: "MODE_429" });
  const rateJob = await waitJob(owner.cookie, rateJobId);
  assert.equal(rateJob.status, "succeeded");
  assert.equal(rateJob.result.fallback_used, true);
  await assertBodyweightKneeSafe(rateJob.result.program_id, owner.cookie);
  const rateGeneration = await prisma.aiGeneration.findUniqueOrThrow({ where: { id: rateJobId } });
  assert.equal(rateGeneration.status, "fallback");
  assert.equal(rateGeneration.errorCode, "rate_limit");
  assert.equal(rateGeneration.fallbackUsed, true);

  const invalidJobId = await generate(owner.cookie, { ...request, notes: "MODE_INVALID" });
  const invalidJob = await waitJob(owner.cookie, invalidJobId);
  assert.equal(invalidJob.status, "succeeded");
  assert.equal(invalidJob.result.fallback_used, true);
  assert.equal(invalidJob.result.repair_attempts, 1);
  await assertBodyweightKneeSafe(invalidJob.result.program_id, owner.cookie);
  const invalidGeneration = await prisma.aiGeneration.findUniqueOrThrow({ where: { id: invalidJobId } });
  assert.equal(invalidGeneration.errorCode, "invalid_output");

  const timeoutJobId = await generate(owner.cookie, { ...request, notes: "MODE_TIMEOUT" });
  const timeoutJob = await waitJob(owner.cookie, timeoutJobId);
  assert.equal(timeoutJob.status, "succeeded");
  assert.equal(timeoutJob.result.fallback_used, true);
  await assertBodyweightKneeSafe(timeoutJob.result.program_id, owner.cookie);
  const timeoutGeneration = await prisma.aiGeneration.findUniqueOrThrow({ where: { id: timeoutJobId } });
  assert.equal(timeoutGeneration.errorCode, "timeout");

  const regenerated = await ok(`/ai/programs/${validProgram.id}/regenerate`, {
    method: "POST",
    body: JSON.stringify({ ...request, days_per_week: 3, notes: "MODE_VALID" })
  }, owner.cookie);
  const regenerateJob = await waitJob(owner.cookie, regenerated.data.job_id);
  assert.equal(regenerateJob.status, "succeeded");
  assert.notEqual(regenerateJob.result.program_id, validProgram.id);
  const regeneratedProgram = await assertBodyweightKneeSafe(regenerateJob.result.program_id, owner.cookie);
  assertSessionCount(regeneratedProgram, 3);

  const quota = await call("/ai/programs/generate", {
    method: "POST",
    body: JSON.stringify(request)
  }, owner.cookie);
  assert.equal(quota.response.status, 429);
  assert.equal(quota.body.error.code, "AI_QUOTA_EXCEEDED");
  assert.ok(quota.response.headers.get("retry-after"));

  const forbiddenProgram = await call(`/programs/${validProgram.id}`, {}, other.cookie);
  assert.equal(forbiddenProgram.response.status, 403);
  const forbiddenJob = await call(`/ai/jobs/${validJobId}`, {}, other.cookie);
  assert.equal(forbiddenJob.response.status, 404);
  const forbiddenRegenerate = await call(`/ai/programs/${validProgram.id}/regenerate`, {
    method: "POST",
    body: JSON.stringify(request)
  }, other.cookie);
  assert.equal(forbiddenRegenerate.response.status, 403);

  console.log("phase5 e2e ok");
  console.log(
    JSON.stringify(
      {
        valid_program: validProgram.id,
        weeks: validProgram.weeks.length,
        sessions_per_week: validProgram.weeks[0].sessions.length,
        bodyweight_only: true,
        knee_safe: true,
        rate_limit_fallback: rateGeneration.errorCode,
        invalid_json_repair_attempts: invalidJob.result.repair_attempts,
        timeout_fallback: timeoutGeneration.errorCode,
        cost_usd: Number(validGeneration.costUsd),
        regenerate_three_days: true,
        quota_status: quota.response.status,
        cross_user: 403
      },
      null,
      2
    )
  );
}

function requireTsx() {
  return join(root, "node_modules/tsx/dist/cli.mjs");
}

let exitCode = 0;
try {
  await main();
} catch (error) {
  exitCode = 1;
  console.error(error);
  for (const { name, logs } of children) {
    console.error(`\n--- ${name} logs ---\n${logs.join("").slice(-8_000)}`);
  }
} finally {
  for (const { child } of children) {
    child.kill("SIGTERM");
  }
  await new Promise((resolve) => setTimeout(resolve, 1_000));
  await prisma.user.deleteMany({ where: { email: { in: [email, otherEmail] } } });
  await prisma.$disconnect();
}
process.exitCode = exitCode;
