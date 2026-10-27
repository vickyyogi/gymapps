import assert from "node:assert/strict";
import { createPrisma } from "./prisma-client.mjs";

const BASE = process.env.BASE_URL ?? "http://localhost:3100/api/v1";
const prisma = createPrisma();

const stamp = Date.now();
const userA = { email: `phase3-a-${stamp}@example.com`, password: "Password123!" };
const userB = { email: `phase3-b-${stamp}@example.com`, password: "Password123!" };

async function call(path, options = {}, cookie) {
  const response = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(cookie ? { cookie } : {}),
      ...(options.headers ?? {})
    }
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
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

async function register(user) {
  const result = await call("/auth/register", {
    method: "POST",
    body: JSON.stringify({ ...user, locale: "id" })
  });
  assert.equal(result.response.status, 201, JSON.stringify(result.body));
  const cookie = result.response.headers.get("set-cookie");
  assert.ok(cookie, "register must set session cookie");
  return { cookie: cookie.split(";")[0], user: result.body.data.user };
}

async function main() {
  const a = await register(userA);
  const b = await register(userB);

  const exercisePage = await ok("/exercises?limit=5", {}, a.cookie);
  assert.equal(exercisePage.data.length, 5);
  assert.ok(exercisePage.nextCursor);
  const libraryCount = await prisma.exercise.count({
    where: { source: "free-exercise-db", deletedAt: null }
  });
  assert.ok(libraryCount >= 800, `exercise library too small: ${libraryCount}`);
  assert.equal(await prisma.muscle.count(), 20);
  assert.equal(await prisma.equipment.count(), 15);
  assert.equal((await ok("/muscles", {}, a.cookie)).data.length, 20);
  assert.equal((await ok("/equipment", {}, a.cookie)).data.length, 15);

  const custom = (
    await ok(
      "/exercises",
      {
        method: "POST",
        body: JSON.stringify({
          name_id: "Bench Press Custom",
          primary_muscle: "chest",
          equipment: ["barbell"]
        })
      },
      a.cookie
    )
  ).data;
  const forbiddenExercise = await call(`/exercises/${custom.id}`, {}, b.cookie);
  assert.equal(forbiddenExercise.response.status, 403);
  const forbiddenEdit = await call(
    `/exercises/${custom.id}`,
    { method: "PATCH", body: JSON.stringify({ name_id: "Stolen" }) },
    b.cookie
  );
  assert.equal(forbiddenEdit.response.status, 403);

  const programOne = (
    await ok(
      "/programs",
      {
        method: "POST",
        body: JSON.stringify({
          name: "Program A",
          split_type: "full_body",
          duration_weeks: 2,
          days_per_week: 2
        })
      },
      a.cookie
    )
  ).data;
  const programTwo = (
    await ok(
      "/programs",
      {
        method: "POST",
        body: JSON.stringify({
          name: "Program B",
          split_type: "upper_lower",
          duration_weeks: 1,
          days_per_week: 2
        })
      },
      a.cookie
    )
  ).data;

  await ok(`/programs/${programOne.id}/activate`, { method: "POST" }, a.cookie);
  await ok(`/programs/${programTwo.id}/activate`, { method: "POST" }, a.cookie);

  let activeConflict = false;
  try {
    await prisma.program.update({
      where: { id: programOne.id },
      data: { status: "active" }
    });
  } catch {
    activeConflict = true;
  }
  assert.equal(activeConflict, true, "DB must reject a second active program");

  const programDetail = await ok(`/programs/${programTwo.id}`, {}, a.cookie);
  assert.equal(programDetail.data.weeks.length, 1);
  const programSession = (
    await ok(
      `/programs/${programTwo.id}/sessions`,
      {
        method: "POST",
        body: JSON.stringify({ week_number: 1, day_index: 1, name: "Upper A" })
      },
      a.cookie
    )
  ).data;

  const seedExercise = (await ok("/exercises?q=Barbell%20Bench%20Press&limit=1", {}, a.cookie)).data[0];
  const programExercise = (
    await ok(
      `/programs/${programTwo.id}/sessions/${programSession.id}/exercises`,
      {
        method: "POST",
        body: JSON.stringify({ exercise_id: seedExercise.id, target_sets: 3, target_reps_min: 5 })
      },
      a.cookie
    )
  ).data;
  assert.ok(programExercise.id);

  const copied = await prisma.program.findUnique({
    where: { id: programTwo.id },
    include: { sessions: { include: { exercises: true } } }
  });
  assert.equal(copied.sessions[0].exercises.length, 1);

  const duplicated = (
    await ok(`/programs/${programTwo.id}/duplicate`, { method: "POST" }, a.cookie)
  ).data;
  assert.equal(duplicated.status, "draft");
  assert.notEqual(duplicated.id, programTwo.id);

  const fromProgram = (
    await ok(
      "/workouts",
      {
        method: "POST",
        body: JSON.stringify({ source: "program", program_session_id: programSession.id })
      },
      a.cookie
    )
  ).data;
  assert.equal(fromProgram.exercises.length, 1);
  assert.equal(fromProgram.exercises[0].exercise_id, seedExercise.id);
  const forbiddenWorkout = await call(`/workouts/${fromProgram.id}`, {}, b.cookie);
  assert.equal(forbiddenWorkout.response.status, 403);

  const workout = (
    await ok(
      "/workouts",
      { method: "POST", body: JSON.stringify({ source: "quick", title: "Gate workout" }) },
      a.cookie
    )
  ).data;
  const workoutExercise = (
    await ok(
      `/workouts/${workout.id}/exercises`,
      { method: "POST", body: JSON.stringify({ exercise_id: seedExercise.id }) },
      a.cookie
    )
  ).data;

  const setPath = `/workouts/${workout.id}/exercises/${workoutExercise.id}/sets`;
  const s1 = await ok(
    setPath,
    { method: "POST", body: JSON.stringify({ weight_kg: 100, reps: 5 }) },
    a.cookie
  );
  await ok(
    setPath,
    { method: "POST", body: JSON.stringify({ weight_kg: 100, reps: 5 }) },
    a.cookie
  );
  const set3Body = JSON.stringify({ weight_kg: 50, reps: 10 });
  const s3 = await ok(
    setPath,
    {
      method: "POST",
      headers: { "idempotency-key": `gate-${stamp}` },
      body: set3Body
    },
    a.cookie
  );
  assert.equal(s3.meta.workout_total_volume_kg, 1500);

  const beforeRetryPrs = await prisma.personalRecord.count({
    where: { workoutSetId: s3.data.id }
  });
  const retry = await ok(
    setPath,
    {
      method: "POST",
      headers: { "idempotency-key": `gate-${stamp}` },
      body: set3Body
    },
    a.cookie
  );
  assert.deepEqual(retry, s3, "retry must return the stored response");
  assert.equal(
    await prisma.personalRecord.count({ where: { workoutSetId: s3.data.id } }),
    beforeRetryPrs,
    "retry must not duplicate PR rows"
  );
  assert.equal(await prisma.workoutSet.count({ where: { workoutId: workout.id } }), 3);
  assert.ok(s1.data.is_pr);

  const forbiddenSet = await call(
    setPath,
    { method: "POST", body: JSON.stringify({ weight_kg: 10, reps: 1 }) },
    b.cookie
  );
  assert.equal(forbiddenSet.response.status, 403);

  const finished = await ok(`/workouts/${workout.id}/finish`, { method: "POST" }, a.cookie);
  assert.equal(finished.data.status, "finished");
  assert.equal(finished.data.total_volume_kg, 1500);
  assert.equal(finished.data.total_sets, 3);
  assert.equal(finished.data.total_reps, 20);
  assert.ok(finished.meta.prs_created >= 1);

  const oldWorkout = (
    await ok(
      "/workouts",
      { method: "POST", body: JSON.stringify({ source: "quick", title: "Old" }) },
      a.cookie
    )
  ).data;
  await prisma.workout.update({
    where: { id: oldWorkout.id },
    data: { startedAt: new Date(Date.now() - 25 * 60 * 60 * 1000) }
  });
  const expired = await ok(`/workouts/${oldWorkout.id}`, {}, a.cookie);
  assert.equal(expired.data.status, "abandoned");

  const history = await ok("/workouts?limit=1", {}, a.cookie);
  assert.equal(history.data.length, 1);
  assert.ok(history.nextCursor);

  console.log("phase3 e2e ok");
  console.log(
    JSON.stringify(
      {
        exercises: libraryCount,
        programs: 3,
        workout_volume: finished.data.total_volume_kg,
        prs_created: finished.meta.prs_created,
        retry_pr_duplicates: 0,
        cross_user: 403,
        second_active_program: "rejected by DB",
        abandoned_after_24h: true
      },
      null,
      2
    )
  );

  await prisma.user.deleteMany({ where: { email: { in: [userA.email, userB.email] } } });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
