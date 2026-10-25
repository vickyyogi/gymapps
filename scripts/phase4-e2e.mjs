import assert from "node:assert/strict";
import { createPrisma } from "./prisma-client.mjs";

const API = process.env.BASE_URL ?? "http://localhost:3100/api/v1";
const APP = process.env.APP_URL ?? "http://localhost:3100";
const prisma = createPrisma();
const stamp = Date.now();
const email = `phase4-${stamp}@example.com`;
const otherEmail = `phase4-other-${stamp}@example.com`;
const password = "Password123!";

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

async function main() {
  const owner = await register(email);
  const other = await register(otherEmail);

  const profile = (
    await ok(
      "/profile",
      {
        method: "PATCH",
        body: JSON.stringify({
          goals: ["gain_muscle", "strength"],
          experience_level: "intermediate",
          days_per_week: 3,
          session_minutes: 60,
          equipment: ["barbell", "bench", "bodyweight"],
          preferred_split: "upper_lower"
        })
      },
      owner.cookie
    )
  ).data;
  assert.deepEqual(profile.goals, ["gain_muscle", "strength"]);

  const onboarding = await ok(
    "/profile/onboarding",
    { method: "POST", body: JSON.stringify({ step: "done" }) },
    owner.cookie
  );
  assert.equal(onboarding.onboarding_completed, true);

  const me = await ok("/auth/me", {}, owner.cookie);
  assert.equal(me.data.onboarding_completed, true);

  const available = await ok(
    "/exercises?available_only=true&equipment=barbell&limit=10",
    {},
    owner.cookie
  );
  assert.ok(available.data.length > 0);
  assert.ok(
    available.data.every((exercise) =>
      exercise.equipment.some((equipment) => ["barbell", "bench", "bodyweight"].includes(equipment))
    )
  );

  const bench = (await ok("/exercises?q=Barbell%20Bench%20Press&limit=1", {}, owner.cookie)).data[0];
  assert.ok(bench);

  const program = (
    await ok(
      "/programs",
      {
        method: "POST",
        body: JSON.stringify({
          name: "Phase 4 Program",
          goal: "gain_muscle",
          split_type: "upper_lower",
          duration_weeks: 1,
          days_per_week: 2,
          session_minutes: 60
        })
      },
      owner.cookie
    )
  ).data;
  const session = (
    await ok(
      `/programs/${program.id}/sessions`,
      {
        method: "POST",
        body: JSON.stringify({ week_number: 1, day_index: 1, name: "Upper A" })
      },
      owner.cookie
    )
  ).data;
  await ok(
    `/programs/${program.id}/sessions/${session.id}/exercises`,
    {
      method: "POST",
      body: JSON.stringify({
        exercise_id: bench.id,
        target_sets: 3,
        target_reps_min: 5,
        target_reps_max: 8
      })
    },
    owner.cookie
  );
  await ok(
    `/programs/${program.id}/sessions`,
    {
      method: "POST",
      body: JSON.stringify({ week_number: 1, day_index: 2, name: "Lower A" })
    },
    owner.cookie
  );
  await ok(`/programs/${program.id}/activate`, { method: "POST" }, owner.cookie);

  const workout = (
    await ok(
      "/workouts",
      {
        method: "POST",
        body: JSON.stringify({ source: "program", program_session_id: session.id })
      },
      owner.cookie
    )
  ).data;
  assert.equal(workout.exercises.length, 1);
  assert.equal(workout.exercises[0].previous_performance, null);

  const wex = workout.exercises[0];
  const setPath = `/workouts/${workout.id}/exercises/${wex.id}/sets`;
  for (let index = 0; index < 3; index += 1) {
    await ok(setPath, { method: "POST", body: JSON.stringify({ weight_kg: 100, reps: 5 }) }, owner.cookie);
  }
  const finished = await ok(`/workouts/${workout.id}/finish`, { method: "POST" }, owner.cookie);
  assert.equal(finished.data.status, "finished");
  assert.equal(finished.data.total_volume_kg, 1500);
  assert.equal(finished.data.total_sets, 3);
  assert.ok(finished.meta.prs_created >= 1);

  const next = (
    await ok("/workouts", { method: "POST", body: JSON.stringify({ source: "quick" }) }, owner.cookie)
  ).data;
  const nextExercise = (
    await ok(
      `/workouts/${next.id}/exercises`,
      { method: "POST", body: JSON.stringify({ exercise_id: bench.id }) },
      owner.cookie
    )
  ).data;
  const withPrevious = await ok(`/workouts/${next.id}`, {}, owner.cookie);
  const previous = withPrevious.data.exercises[0].previous_performance;
  assert.ok(previous);
  assert.equal(typeof previous.date, "string");
  assert.equal(previous.sets.length, 3);
  await ok(
    `/workouts/${next.id}/exercises/${nextExercise.id}/sets`,
    { method: "POST", body: JSON.stringify({ weight_kg: 105, reps: 5 }) },
    owner.cookie
  );
  const withDelta = await ok(`/workouts/${next.id}`, {}, owner.cookie);
  assert.deepEqual(withDelta.data.exercises[0].sets[0].delta_vs_last, {
    weight_kg: 5,
    reps: 0
  });
  await ok(`/workouts/${next.id}/finish`, { method: "POST" }, owner.cookie);

  const summary = (await ok("/analytics/summary?range=4w", {}, owner.cookie)).data;
  assert.ok(summary.volume_7d_kg >= 2025);
  assert.ok(summary.total_prs >= 1);
  assert.ok(summary.muscle_balance.length >= 1);
  assert.ok(Array.isArray(summary.insights));

  const volume = (await ok("/analytics/volume?range=3m", {}, owner.cookie)).data;
  assert.ok(volume.series.length >= 1);
  assert.ok(volume.series.at(-1).volume_kg > 0);
  assert.ok(volume.insight.text);

  const records = (await ok("/analytics/personal-records?limit=10", {}, owner.cookie)).data;
  assert.ok(records.length >= 1);
  assert.equal(records[0].is_current, true);

  const balance = (await ok("/analytics/muscle-balance?weeks=4", {}, owner.cookie)).data;
  assert.ok(balance.muscles.length >= 1);

  const adherence = (await ok("/analytics/adherence?weeks=4", {}, owner.cookie)).data;
  assert.equal(adherence.length, 4);
  assert.equal(adherence.at(-1).completed_sessions, 1);

  const oneRm = (await ok(`/analytics/one-rm?exercise_id=${bench.id}&range=3m`, {}, owner.cookie)).data;
  assert.ok(oneRm.points.length >= 4);
  assert.ok(oneRm.points.at(-1).est_1rm_kg > 100);

  const calendar = (await ok("/analytics/calendar?weeks=12", {}, owner.cookie)).data;
  assert.equal(calendar.days.length, 84);
  assert.ok(calendar.days.some((day) => day.intensity > 0));

  const metric = (
    await ok(
      "/body-metrics",
      {
        method: "POST",
        body: JSON.stringify({
          recorded_on: "2026-10-22",
          weight_kg: 80.5,
          body_fat_pct: 18.2,
          waist_cm: 84,
          notes: "Cut minggu 1"
        })
      },
      owner.cookie
    )
  ).data;
  const metricUpdated = (
    await ok(
      "/body-metrics",
      {
        method: "POST",
        body: JSON.stringify({ recorded_on: "2026-10-22", weight_kg: 80.1, waist_cm: 83.5 })
      },
      owner.cookie
    )
  ).data;
  assert.equal(metricUpdated.id, metric.id);
  assert.equal(await prisma.bodyMetric.count({ where: { userId: owner.user.id, recordedOn: new Date("2026-10-22") } }), 1);
  const metrics = (await ok("/body-metrics?limit=10", {}, owner.cookie)).data;
  assert.equal(metrics.length, 1);
  assert.equal(metrics[0].weight_kg, 80.1);

  const forbiddenMetric = await call(
    `/body-metrics/${metric.id}`,
    { method: "PATCH", body: JSON.stringify({ weight_kg: 90 }) },
    other.cookie
  );
  assert.equal(forbiddenMetric.response.status, 403);

  const note = (
    await ok(
      "/notes",
      {
        method: "POST",
        body: JSON.stringify({
          body: "Bahu kiri nyeri ringan setelah bench.",
          category: "injury",
          is_pinned: true,
          workout_id: workout.id
        })
      },
      owner.cookie
    )
  ).data;
  const notes = await ok("/notes?limit=10", {}, owner.cookie);
  assert.equal(notes.data.length, 1);
  assert.equal(notes.data[0].is_pinned, true);
  const updatedNote = (
    await ok(
      `/notes/${note.id}`,
      { method: "PATCH", body: JSON.stringify({ is_pinned: false, body: "Bahu membaik." }) },
      owner.cookie
    )
  ).data;
  assert.equal(updatedNote.is_pinned, false);
  const forbiddenNote = await call(
    `/notes/${note.id}`,
    { method: "DELETE" },
    other.cookie
  );
  assert.equal(forbiddenNote.response.status, 403);
  const deleteNote = await call(`/notes/${note.id}`, { method: "DELETE" }, owner.cookie);
  assert.equal(deleteNote.response.status, 204);

  const dashboard = await fetch(`${APP}/id/dashboard`, {
    headers: { cookie: owner.cookie },
    redirect: "manual"
  });
  assert.equal(dashboard.status, 200);
  const html = await dashboard.text();
  assert.ok(html.includes("Dasbor") || html.includes("Memuat"));

  console.log("phase4 e2e ok");
  console.log(
    JSON.stringify(
      {
        onboarding: true,
        available_only: available.data.length,
        workout_volume: finished.data.total_volume_kg,
        previous_performance_sets: previous.sets.length,
        delta_weight_kg: withDelta.data.exercises[0].sets[0].delta_vs_last.weight_kg,
        summary_volume_7d: summary.volume_7d_kg,
        prs: records.length,
        calendar_days: calendar.days.length,
        body_metric_upsert: "unique per date",
        notes_crud: true,
        dashboard_status: dashboard.status,
        cross_user: 403
      },
      null,
      2
    )
  );

  await prisma.user.deleteMany({ where: { email: { in: [email, otherEmail] } } });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
