import { createServer } from "node:http";
import { generateFallbackProgram } from "@gymapps/domain";

const port = Number(process.env.MOCK_AI_PORT) || 3199;
let requests = [];

function json(response, status, body) {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}

function contextFrom(body) {
  const content = body.messages?.at(-1)?.content ?? "";
  const match = content.match(/<context>\n([\s\S]*?)\n<\/context>/);
  if (!match) throw new Error("context missing");
  return JSON.parse(match[1]);
}

function emitProgram(context) {
  const available = context.available_exercises.map((exercise) => ({
    id: exercise.id,
    name: exercise.name,
    primaryMuscle: exercise.primary_muscle,
    secondaryMuscles: exercise.secondary_muscles,
    equipment: exercise.equipment,
    kind: exercise.is_compound ? "compound" : "isolation",
    contraindications: []
  }));
  const equipment = [
    ...new Set(["bodyweight", ...(context.profile?.equipment ?? []), ...(context.request?.equipment_overrides ?? [])])
  ];
  const program = generateFallbackProgram({
    splitType: context.request.split_type,
    daysPerWeek: context.request.days_per_week,
    durationWeeks: context.request.duration_weeks,
    sessionMinutes: context.request.session_minutes,
    availableEquipment: equipment,
    injuries: [],
    catalog: available
  });

  const injuries = context.request?.avoid_areas ?? [];
  return {
    name: "Program AI Mock",
    split_type: program.splitType,
    duration_weeks: program.durationWeeks,
    goal: context.request.goal,
    weeks: program.weeks.map((week) => ({
      week_number: week.weekNumber,
      focus_note: week.weekNumber === 1 ? "Aklimatisasi" : "Progresif",
      is_deload: Boolean(week.isDeload),
      sessions: week.sessions.map((session) => ({
        day_index: session.dayIndex,
        name: session.name,
        estimated_minutes: session.estimatedMinutes ?? context.request.session_minutes,
        exercises: session.exercises.map((exercise) => ({
          exercise_id: exercise.exerciseId,
          position: exercise.position,
          target_sets: exercise.targetSets,
          target_reps_min: exercise.targetRepsMin,
          target_reps_max: exercise.targetRepsMax,
          target_rpe: 7,
          rest_seconds: exercise.restSeconds,
          is_warmup: Boolean(exercise.isWarmup),
          superset_group: null,
          progression: {
            type: exercise.progression.type,
            ...(exercise.progression.incrementKg !== undefined
              ? { increment_kg: exercise.progression.incrementKg }
              : {}),
            ...(exercise.progression.incrementReps !== undefined
              ? { increment_reps: exercise.progression.incrementReps }
              : {}),
            ...(exercise.progression.maxReps !== undefined
              ? { max_reps: exercise.progression.maxReps }
              : {})
          }
        }))
      }))
    })),
    rationale: "Program mock memakai compound lebih dulu lalu isolation, dengan volume mingguan yang seimbang.",
    assumptions: ["Beban awal disesuaikan dengan kemampuan user."],
    safety_notes: injuries.length
      ? [`Area cedera dihindari: ${injuries.join(", ")}.`, "Hentikan latihan bila nyeri bertambah."]
      : ["Hentikan latihan bila nyeri bertambah."]
  };
}

const server = createServer(async (request, response) => {
  if (request.method === "GET" && request.url === "/requests") {
    json(response, 200, { data: requests });
    return;
  }
  if (request.method === "POST" && request.url === "/reset") {
    requests = [];
    json(response, 200, { ok: true });
    return;
  }
  if (request.method === "GET" && request.url === "/health") {
    json(response, 200, { ok: true });
    return;
  }
  if (request.method !== "POST" || request.url !== "/v1/chat/completions") {
    json(response, 404, { error: "not found" });
    return;
  }

  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  const context = contextFrom(body);
  requests.push(context);
  const mode = String(context.request?.notes ?? "").toUpperCase();

  if (mode.includes("MODE_429")) {
    json(response, 429, { error: { message: "mock rate limit" } });
    return;
  }
  if (mode.includes("MODE_TIMEOUT")) {
    await new Promise((resolve) => setTimeout(resolve, 2_000));
    json(response, 500, { error: { message: "mock timeout" } });
    return;
  }
  if (mode.includes("MODE_INVALID")) {
    json(response, 200, {
      choices: [{ message: { role: "assistant", content: "ini bukan json" } }],
      usage: { prompt_tokens: 100, completion_tokens: 10 }
    });
    return;
  }

  const program = emitProgram(context);
  json(response, 200, {
    choices: [
      {
        message: {
          role: "assistant",
          content: null,
          tool_calls: [
            {
              id: "call_mock",
              type: "function",
              function: { name: "emit_program", arguments: JSON.stringify(program) }
            }
          ]
        }
      }
    ],
    usage: { prompt_tokens: 1200, completion_tokens: 800 }
  });
});

server.listen(port, () => {
  console.log(`mock ai listening on ${port}`);
});
