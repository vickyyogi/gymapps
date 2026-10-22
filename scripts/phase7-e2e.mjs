import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.PHASE7_PORT) || 3107;
const APP = `http://127.0.0.1:${port}`;
const API = `${APP}/api/v1`;
const prisma = new PrismaClient();
const stamp = Date.now();
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
  children.push({ child, name: options.name, logs });
  return child;
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
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(cookie ? { cookie } : {}),
      ...(options.headers ?? {})
    }
  });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { response, body };
}

async function ok(path, options, cookie) {
  const result = await call(path, options, cookie);
  assert.ok(
    result.response.status >= 200 && result.response.status < 300,
    `${options?.method ?? "GET"} ${path} -> ${result.response.status}: ${JSON.stringify(result.body)}`
  );
  return result.body;
}

async function register(email) {
  const result = await call("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, locale: "id" })
  });
  assert.equal(result.response.status, 201, JSON.stringify(result.body));
  const cookie = result.response.headers.get("set-cookie");
  assert.ok(cookie);
  return { cookie: cookie.split(";")[0], user: result.body.data.user };
}

async function poll(path, cookie, timeoutMs = 90_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const data = (await ok(path, {}, cookie)).data;
    if (data.status === "ready" || data.status === "failed") return data;
    await new Promise((resolve) => setTimeout(resolve, 700));
  }
  throw new Error(`Timed out polling ${path}`);
}

async function download(url, cookie) {
  return fetch(`${APP}${url}`, { headers: { cookie } });
}

function thisMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

async function main() {
  start(process.execPath, [join(root, "node_modules/next/dist/bin/next"), "dev", "-p", String(port)], {
    name: "next",
    cwd: join(root, "apps/web"),
    env: {
      EXPORT_DIR: join(root, ".exports-test"),
      EXPORT_SIGNING_SECRET: "phase7-test-secret",
      CHROME_PATH: process.env.CHROME_PATH || "/usr/bin/google-chrome"
    }
  });

  await waitFor(`${API}/health`);

  const owner = await register(`phase7-${stamp}@example.com`);
  const other = await register(`phase7-other-${stamp}@example.com`);
  const exercise = await prisma.exercise.findFirstOrThrow({
    where: { status: "published", ownerUserId: null },
    orderBy: { id: "asc" }
  });

  const workoutId = `wkt_phase7_${stamp}`;
  const workoutExerciseId = `wex_phase7_${stamp}`;
  const setId = `wst_phase7_${stamp}`;
  const startedAt = new Date(Date.now() - 86_400_000);
  await prisma.workout.create({
    data: {
      id: workoutId,
      userId: owner.user.id,
      title: "Phase 7 upper",
      status: "finished",
      startedAt,
      endedAt: new Date(startedAt.getTime() + 3_600_000),
      durationSeconds: 3600,
      totalVolumeKg: 4800,
      totalSets: 12,
      totalReps: 96
    }
  });
  await prisma.workoutExercise.create({
    data: {
      id: workoutExerciseId,
      workoutId,
      exerciseId: exercise.id,
      position: 1
    }
  });
  await prisma.workoutSet.create({
    data: {
      id: setId,
      workoutExerciseId,
      workoutId,
      userId: owner.user.id,
      exerciseId: exercise.id,
      setNumber: 1,
      weightKg: 80,
      reps: 8,
      isCompleted: true,
      isPr: true,
      est1rmKg: 101.3,
      volumeKg: 640
    }
  });
  await prisma.personalRecord.create({
    data: {
      id: `pr_phase7_${stamp}`,
      userId: owner.user.id,
      exerciseId: exercise.id,
      recordType: "max_weight",
      value: 80,
      reps: 8,
      weightKg: 80,
      achievedAt: startedAt,
      workoutSetId: setId
    }
  });

  const createdJson = await ok("/exports", {
    method: "POST",
    body: JSON.stringify({ format: "json" })
  }, owner.cookie);
  assert.equal(createdJson.data.status, "queued");
  const jsonStatus = await poll(`/exports/${createdJson.data.export_id}`, owner.cookie);
  assert.equal(jsonStatus.status, "ready", JSON.stringify(jsonStatus));
  assert.ok(jsonStatus.download_url);
  assert.ok(jsonStatus.expires_at);

  const jsonDownload = await download(jsonStatus.download_url, owner.cookie);
  assert.equal(jsonDownload.status, 200);
  assert.match(jsonDownload.headers.get("content-type") ?? "", /application\/json/);
  const jsonBody = await jsonDownload.json();
  assert.equal(jsonBody.user.email, `phase7-${stamp}@example.com`);
  assert.ok(jsonBody.workouts.length >= 1);
  assert.ok(jsonBody.sets.length >= 1);
  assert.ok(Array.isArray(jsonBody.programs));

  const createdCsv = await ok("/exports", {
    method: "POST",
    body: JSON.stringify({ format: "csv", entities: ["workouts", "sets"] })
  }, owner.cookie);
  const csvStatus = await poll(`/exports/${createdCsv.data.export_id}`, owner.cookie);
  assert.equal(csvStatus.status, "ready");
  const csvDownload = await download(csvStatus.download_url, owner.cookie);
  assert.equal(csvDownload.status, 200);
  assert.match(csvDownload.headers.get("content-type") ?? "", /text\/csv/);
  const csvText = await csvDownload.text();
  assert.match(csvText, /entity,id,payload/);
  assert.match(csvText, /workouts/);

  const crossUser = await download(jsonStatus.download_url, other.cookie);
  assert.equal(crossUser.status, 403, "cross-user download must be 403");
  const tampered = await download(
    jsonStatus.download_url.replace(/token=[^&]+/, "token=tampered"),
    owner.cookie
  );
  assert.equal(tampered.status, 403);

  await prisma.export.update({
    where: { id: createdJson.data.export_id },
    data: { expiresAt: new Date(Date.now() - 1000) }
  });
  const expiredDownload = await download(jsonStatus.download_url, owner.cookie);
  assert.equal(expiredDownload.status, 410);
  const expiredBody = await expiredDownload.json();
  assert.equal(expiredBody.error.code, "EXPORT_EXPIRED");
  const expiredStatus = (await ok(`/exports/${createdJson.data.export_id}`, {}, owner.cookie)).data;
  assert.equal(expiredStatus.download_url, null);
  assert.equal(expiredStatus.expired, true);

  const reportCreated = await ok("/reports", {
    method: "POST",
    body: JSON.stringify({ month: thisMonth(), include_body_metrics: true })
  }, owner.cookie);
  const reportStatus = await poll(`/reports/${reportCreated.data.report_id}`, owner.cookie, 120_000);
  assert.equal(reportStatus.status, "ready", JSON.stringify(reportStatus));
  assert.ok(reportStatus.download_url);
  const reportDownload = await download(reportStatus.download_url, owner.cookie);
  assert.equal(reportDownload.status, 200);
  assert.match(reportDownload.headers.get("content-type") ?? "", /application\/pdf/);
  const pdf = Buffer.from(await reportDownload.arrayBuffer());
  assert.equal(pdf.subarray(0, 4).toString(), "%PDF");
  assert.ok(pdf.length > 1000);
  const crossReport = await download(reportStatus.download_url, other.cookie);
  assert.equal(crossReport.status, 403);

  const notifications = await ok("/notifications", {}, owner.cookie);
  assert.ok(notifications.meta.unread_count >= 2);
  assert.ok(notifications.data.some((row) => row.type === "export"));
  assert.ok(notifications.data.some((row) => row.type === "report"));
  const notificationId = notifications.data[0].id;
  const marked = await ok(`/notifications/${notificationId}`, { method: "PATCH" }, owner.cookie);
  assert.ok(marked.data.read_at);
  const readAll = await ok("/notifications/read-all", { method: "POST" }, owner.cookie);
  assert.ok(readAll.data.updated >= 1);

  await prisma.user.update({ where: { id: owner.user.id }, data: { role: "admin" } });
  const forbiddenAdmin = await call("/admin/exercises", {}, other.cookie);
  assert.equal(forbiddenAdmin.response.status, 403);
  const adminName = `Phase 7 Admin ${stamp}`;
  const adminCreated = await ok("/admin/exercises", {
    method: "POST",
    body: JSON.stringify({
      name_id: adminName,
      name_en: adminName,
      description_id: "Dibuat lewat admin CMS",
      instructions_id: ["Langkah awal"],
      primary_muscle: "full_body",
      secondary_muscles: [],
      equipment: ["bodyweight"],
      difficulty: "beginner"
    })
  }, owner.cookie);
  const adminId = adminCreated.data.id;
  assert.ok(adminId);
  const published = await ok(`/admin/exercises/${adminId}`, {
    method: "PATCH",
    body: JSON.stringify({
      instructions_id: ["Langkah awal", "Langkah publish tanpa deploy"],
      status: "published"
    })
  }, owner.cookie);
  assert.equal(published.data.status, "published");
  const userVisible = await ok(`/exercises/${adminId}`, {}, other.cookie);
  assert.equal(userVisible.data.status, "published");
  assert.ok(userVisible.data.instructions_id.includes("Langkah publish tanpa deploy"));
  const audit = await prisma.auditLog.findFirst({
    where: { entityType: "exercise", entityId: adminId, action: "exercise.published" }
  });
  assert.ok(audit);

  const manifestResponse = await fetch(`${APP}/manifest.webmanifest`);
  assert.equal(manifestResponse.status, 200);
  const manifest = await manifestResponse.json();
  assert.equal(manifest.display, "standalone");
  assert.ok(manifest.start_url.startsWith("/"));
  const sizes = manifest.icons.map((icon) => icon.sizes);
  assert.ok(sizes.includes("192x192"));
  assert.ok(sizes.includes("512x512"));
  for (const icon of manifest.icons) {
    const response = await fetch(`${APP}${icon.src}`);
    assert.equal(response.status, 200, icon.src);
    assert.match(response.headers.get("content-type") ?? "", /image\/png/);
  }
  const sw = await fetch(`${APP}/sw.js`);
  assert.equal(sw.status, 200);
  assert.match(await sw.text(), /offline\.html/);
  const offline = await fetch(`${APP}/offline.html`);
  assert.equal(offline.status, 200);

  const listed = await ok("/exports", {}, owner.cookie);
  assert.ok(listed.data.length >= 3);

  console.log("phase7 e2e ok");
  console.log(
    JSON.stringify(
      {
        export_json_ready: true,
        export_csv_ready: true,
        cross_user_403: true,
        expired_410: true,
        pdf_pdf_header: true,
        pdf_bytes: pdf.length,
        notifications_unread: notifications.meta.unread_count,
        admin_publish_without_deploy: true,
        audit_log: true,
        pwa_manifest: true,
        pwa_icons: manifest.icons.length,
        service_worker_offline: true
      },
      null,
      2
    )
  );
}

let exitCode = 0;
try {
  await main();
} catch (error) {
  exitCode = 1;
  console.error(error);
  for (const { name, logs } of children) {
    console.error(`\n--- ${name} logs ---\n${logs.join("").slice(-12_000)}`);
  }
} finally {
  for (const { child } of children) child.kill("SIGTERM");
  await prisma.$disconnect();
  await rm(join(root, ".exports-test"), { recursive: true, force: true });
}
process.exit(exitCode);
