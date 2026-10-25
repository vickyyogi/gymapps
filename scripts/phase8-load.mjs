import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createPrisma } from "./prisma-client.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.PHASE8_LOAD_PORT) || 3108;
const appUrl = `http://127.0.0.1:${port}`;
const apiUrl = `${appUrl}/api/v1`;
const iterations = Number(process.env.LOAD_ITERATIONS) || 20;
const concurrency = Number(process.env.LOAD_CONCURRENCY) || 5;
const weeks = Number(process.env.LOAD_WEEKS) || 26;
const prisma = createPrisma();
const stamp = Date.now();
const password = "Password123!";
const email = `phase8-load-${stamp}@example.com`;
const DAY = 24 * 60 * 60 * 1000;
let userId = null;
let server = null;

function stopServer() {
  if (!server || server.exitCode !== null) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(server.pid), "/T", "/F"], { stdio: "ignore" });
  } else {
    server.kill("SIGTERM");
  }
}

async function waitFor(url, timeoutMs = 120_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // not ready
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function call(path, options = {}, cookie) {
  const response = await fetch(`${apiUrl}${path}`, {
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

async function register() {
  const result = await call("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, locale: "id" })
  });
  assert.equal(result.response.status, 201, JSON.stringify(result.body));
  const cookie = result.response.headers.get("set-cookie");
  assert.ok(cookie, "register must set session cookie");
  return { cookie: cookie.split(";")[0], userId: result.body.data.user.id };
}

async function seed() {
  const exercises = await prisma.exercise.findMany({
    where: { status: "published", ownerUserId: null },
    orderBy: { id: "asc" },
    take: 20
  });
  assert.ok(exercises.length >= 4, "seed exercises required");

  const programId = `prg_load_${stamp}`;
  const startDate = new Date(Date.now() - weeks * 7 * DAY);
  await prisma.program.create({
    data: {
      id: programId,
      userId,
      name: "Phase 8 load",
      splitType: "full_body",
      durationWeeks: 12,
      daysPerWeek: 4,
      status: "active",
      startDate
    }
  });
  for (let week = 1; week <= 12; week += 1) {
    const weekId = `pwk_load_${stamp}_${week}`;
    await prisma.programWeek.create({
      data: { id: weekId, programId, weekNumber: week }
    });
    await prisma.programSession.createMany({
      data: Array.from({ length: 4 }, (_, day) => ({
        id: `pss_load_${stamp}_${week}_${day}`,
        programId,
        programWeekId: weekId,
        dayIndex: day,
        name: `Week ${week} Day ${day + 1}`,
        completedAt: week <= 10 ? new Date(startDate.getTime() + (week - 1) * 7 * DAY) : null
      }))
    });
  }

  for (let week = 0; week < weeks; week += 1) {
    for (let day = 0; day < 4; day += 1) {
      const index = week * 4 + day;
      const workoutId = `wkt_load_${stamp}_${index}`;
      const startedAt = new Date(startDate.getTime() + week * 7 * DAY + day * DAY);
      const weight = 40 + (week % 6) * 5;
      const setVolume = weight * 8;
      const exerciseSlice = exercises.slice(day % 4, (day % 4) + 4);
      await prisma.workout.create({
        data: {
          id: workoutId,
          userId,
          title: `Load ${index}`,
          status: "finished",
          startedAt,
          endedAt: new Date(startedAt.getTime() + 3_600_000),
          durationSeconds: 3600,
          totalSets: exerciseSlice.length * 3,
          totalReps: exerciseSlice.length * 3 * 8,
          totalVolumeKg: exerciseSlice.length * 3 * setVolume
        }
      });
      const workoutExercises = exerciseSlice.map((exercise, position) => ({
        id: `wex_load_${stamp}_${index}_${position}`,
        workoutId,
        exerciseId: exercise.id,
        position: position + 1
      }));
      await prisma.workoutExercise.createMany({ data: workoutExercises });
      await prisma.workoutSet.createMany({
        data: workoutExercises.flatMap((workoutExercise) =>
          Array.from({ length: 3 }, (_, setIndex) => ({
            id: `wst_load_${stamp}_${index}_${workoutExercise.position}_${setIndex}`,
            workoutExerciseId: workoutExercise.id,
            workoutId,
            userId,
            exerciseId: workoutExercise.exerciseId,
            setNumber: setIndex + 1,
            weightKg: weight,
            reps: 8,
            isCompleted: true,
            volumeKg: setVolume,
            createdAt: new Date(startedAt.getTime() + setIndex * 60_000)
          }))
        )
      });
    }
  }

  await prisma.personalRecord.createMany({
    data: exercises.map((exercise, index) => ({
      id: `pr_load_${stamp}_${index}`,
      userId,
      exerciseId: exercise.id,
      recordType: "max_weight",
      value: 80 + index,
      reps: 8,
      weightKg: 80 + index,
      achievedAt: new Date(Date.now() - index * DAY)
    }))
  });

  return { exerciseId: exercises[0].id, workouts: weeks * 4 };
}

function percentile(values, p) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * p) - 1));
  return sorted[index];
}

async function measure(cookie, exerciseId) {
  const endpoints = [
    "/analytics/summary?range=1y",
    "/analytics/volume?range=1y",
    "/analytics/personal-records?limit=50",
    "/analytics/muscle-balance?weeks=26",
    "/analytics/adherence?weeks=26",
    `/analytics/one-rm?exercise_id=${encodeURIComponent(exerciseId)}&range=1y`,
    "/analytics/calendar?weeks=26"
  ];

  for (const path of endpoints) {
    await call(path, {}, cookie);
  }

  const queue = Array.from({ length: iterations }, () => endpoints).flat();
  let cursor = 0;
  const durations = [];
  const failures = [];

  async function worker() {
    while (cursor < queue.length) {
      const path = queue[cursor];
      cursor += 1;
      const start = performance.now();
      try {
        const result = await call(path, {}, cookie);
        if (result.response.status !== 200) {
          failures.push({ path, status: result.response.status, body: result.body });
        }
      } catch (error) {
        failures.push({ path, error: String(error) });
      } finally {
        durations.push(performance.now() - start);
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));
  const errorRate = failures.length / durations.length;

  return {
    requests: durations.length,
    concurrency,
    p50_ms: Math.round(percentile(durations, 0.5)),
    p95_ms: Math.round(percentile(durations, 0.95)),
    p99_ms: Math.round(percentile(durations, 0.99)),
    error_rate: Number(errorRate.toFixed(4)),
    failures: failures.slice(0, 5)
  };
}

async function opsMetrics() {
  const since = new Date(Date.now() - 7 * DAY);
  const realUsers = { email: { not: { startsWith: "phase" } } };
  const [statuses, cost, active, aiUsers] = await Promise.all([
    prisma.aiGeneration.groupBy({
      by: ["status"],
      where: { createdAt: { gte: since }, user: realUsers },
      _count: { _all: true }
    }),
    prisma.aiGeneration.aggregate({
      where: { createdAt: { gte: since }, user: realUsers },
      _sum: { costUsd: true }
    }),
    prisma.workout.findMany({
      where: {
        status: "finished",
        deletedAt: null,
        startedAt: { gte: since },
        user: realUsers
      },
      select: { userId: true },
      distinct: ["userId"]
    }),
    prisma.aiGeneration.findMany({
      where: { createdAt: { gte: since }, user: realUsers },
      select: { userId: true },
      distinct: ["userId"]
    })
  ]);

  const counts = Object.fromEntries(statuses.map((row) => [row.status, row._count._all]));
  const completed = (counts.succeeded ?? 0) + (counts.fallback ?? 0) + (counts.failed ?? 0);
  const failureRate = completed ? (counts.failed ?? 0) / completed : null;
  const fallbackRate = completed ? (counts.fallback ?? 0) / completed : null;
  const spend = Number(cost._sum.costUsd ?? 0);
  const wau = active.length;

  return {
    window_days: 7,
    ai_statuses: counts,
    ai_completed: completed,
    ai_failure_rate: failureRate === null ? null : Number(failureRate.toFixed(4)),
    ai_fallback_rate: fallbackRate === null ? null : Number(fallbackRate.toFixed(4)),
    ai_cost_usd: Number(spend.toFixed(4)),
    active_users_7d: wau,
    ai_users_7d: aiUsers.length,
    cost_per_wau_usd: wau ? Number((spend / wau).toFixed(4)) : null,
    note:
      completed < 20
        ? "AI failure gate needs >=20 completed generations"
        : failureRate < 0.02
          ? "AI failure gate pass"
          : "AI failure gate FAIL"
  };
}

async function main() {
  server = spawn(
    process.execPath,
    [join(root, "node_modules/next/dist/bin/next"), "dev", "-p", String(port)],
    {
      cwd: join(root, "apps/web"),
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"]
    }
  );
  const logs = [];
  server.stdout.on("data", (chunk) => logs.push(chunk.toString()));
  server.stderr.on("data", (chunk) => logs.push(chunk.toString()));

  try {
    await waitFor(`${apiUrl}/health`);
    const owner = await register();
    userId = owner.userId;
    const seeded = await seed();
    const load = await measure(owner.cookie, seeded.exerciseId);
    if (userId) {
      await prisma.user.delete({ where: { id: userId } });
      userId = null;
    }
    const metrics = await opsMetrics();

    assert.ok(load.p95_ms < 1000, `analytics p95 ${load.p95_ms}ms exceeds 1000ms`);
    assert.ok(load.error_rate < 0.005, `error rate ${load.error_rate} exceeds 0.5%`);
    if (metrics.ai_failure_rate !== null && metrics.ai_completed >= 20 && metrics.ai_failure_rate >= 0.02) {
      assert.fail(`AI failure rate ${metrics.ai_failure_rate} exceeds 2%`);
    }
    if (metrics.cost_per_wau_usd !== null && metrics.cost_per_wau_usd > 0.3) {
      assert.fail(`AI cost per WAU $${metrics.cost_per_wau_usd} exceeds $0.30`);
    }

    console.log(
      JSON.stringify(
        {
          phase8_load: "ok",
          seeded_workouts: seeded.workouts,
          ...load,
          ...metrics
        },
        null,
        2
      )
    );
  } catch (error) {
    if (logs.length) console.error(logs.join(""));
    throw error;
  } finally {
    stopServer();
    if (userId) await prisma.user.delete({ where: { id: userId } }).catch(() => {});
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
