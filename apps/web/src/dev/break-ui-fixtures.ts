// Dev-only break-ui fixtures. Never imported by production code paths.
// Shapes mirror the /api/v1 responses DashboardOverview consumes and the
// props dashboard/page.tsx passes. Worst-case values are schema-backed or
// realistic: limits from packages/shared/src/auth.ts, apps/web/src/lib/api/phase3-validation.ts,
// packages/db/prisma/schema.prisma.

export type FixtureName = "demo" | "worst" | "empty" | "one" | "huge";

export type Fixture = {
  label: string;
  name: string;
  unitSystem: "metric" | "imperial";
  login: { status: number; body: unknown; autoSubmit?: boolean };
  loginPrefill?: { email: string };
  summary: {
    weekly_logged_workouts: number;
    volume_7d_kg: number;
    volume_30d_kg: number;
    current_streak: number;
    adherence_current_week: number | null;
    total_prs: number;
    last_pr: { exercise_name: string; value: number; unit: string; achieved_at: string } | null;
    previous_period_delta_pct: { volume: number; workouts: number; adherence: number };
    muscle_balance: Array<{ muscle: string; share_pct: number }>;
    insights: Array<{ key: string; params: Record<string, string | number> }>;
  };
  volume: {
    series: Array<{ week_start: string; volume_kg: number; working_sets: number }>;
    insight: { key: string; params: Record<string, string | number>; delta_pct: number };
  };
  calendar: { days: Array<{ date: string; volume_kg: number; intensity: number }> };
  active: { id: string; title: string; total_sets: number } | null;
  program: { id: string; name: string; goal: string | null; status: string; completion_pct: number } | null;
  profile: { goals: string[]; days_per_week: number | null; equipment: string[] };
};

function days(
  startISO: string,
  count: number,
  fn: (i: number) => { volume_kg: number; intensity: number }
) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(`${startISO}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + i);
    return { date: d.toISOString().slice(0, 10), ...fn(i) };
  });
}

function weeks(
  startISO: string,
  count: number,
  fn: (i: number) => { volume_kg: number; working_sets: number }
) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(`${startISO}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + i * 7);
    return { week_start: d.toISOString().slice(0, 10), ...fn(i) };
  });
}

// --- Demo data: the kind dataset the design was drawn against ---
const demo: Fixture = {
  label: "Demo data",
  name: "Budi Santoso",
  unitSystem: "metric",
  login: { status: 401, body: { error: { code: "INVALID_CREDENTIALS" } } },
  loginPrefill: { email: "budi@example.com" },
  summary: {
    weekly_logged_workouts: 3,
    volume_7d_kg: 4250,
    volume_30d_kg: 17000,
    current_streak: 5,
    adherence_current_week: 0.667,
    total_prs: 3,
    last_pr: {
      exercise_name: "Barbell Bench Press",
      value: 82.5,
      unit: "est_1rm",
      achieved_at: "2026-10-24T09:12:00.000Z"
    },
    previous_period_delta_pct: { volume: 6.2, workouts: 0, adherence: 0 },
    muscle_balance: [
      { muscle: "chest", share_pct: 34 },
      { muscle: "quads", share_pct: 28 },
      { muscle: "back", share_pct: 21.5 }
    ],
    insights: [{ key: "volumeUp", params: { pct: 6.2 } }]
  },
  volume: {
    series: weeks("2026-08-31", 8, (i) => ({ volume_kg: 3800 + i * 120, working_sets: 42 + i })),
    insight: { key: "volumeUp", params: { pct: 6.2 }, delta_pct: 6.2 }
  },
  calendar: { days: days("2026-08-31", 56, (i) => ({ volume_kg: i % 3 === 0 ? 1200 : 0, intensity: i % 3 === 0 ? 2 : 0 })) },
  active: { id: "wkt_1", title: "Push Day A", total_sets: 18 },
  program: {
    id: "prg_1",
    name: "Strength Foundation",
    goal: "strength",
    status: "active",
    completion_pct: 42
  },
  profile: { goals: ["strength"], days_per_week: 4, equipment: ["barbell", "bench"] }
};

// --- Worst case: one dataset, every catalog row that applies at once ---
const worst: Fixture = {
  label: "Worst case",
  // displayName path, 80-char schema limit (phase4-validation.ts:72)
  name: "Aleksandra Wiśniewska-Kowalczyk-Moskwa von Hohenberg zu Oettingen-Baden",
  unitSystem: "imperial", // widens every number
  login: { status: 429, body: { error: { code: "RATE_LIMITED" } }, autoSubmit: true },
  // realistic long corporate address; login schema caps email at 254 (shared/auth.ts:19)
  loginPrefill: {
    email:
      "bartholomew.fitzgerald.montgomery-wellesley-smythe@northwind-industries-holdings-international.example.com"
  },
  summary: {
    weekly_logged_workouts: 12,
    // Decimal(12,2) sums; extreme but real week for a heavy athlete
    volume_7d_kg: 68425.5,
    volume_30d_kg: 261250.25,
    current_streak: 728,
    adherence_current_week: 1,
    total_prs: 1284, // needs thousands separator
    last_pr: {
      // custom exercise name, 120-char schema limit (phase3-validation.ts:78)
      exercise_name:
        "Barbell Romanian Deadlift from Deficit with Reverse Band Accommodating Chains Plus Paused Reset",
      value: 265.5,
      unit: "est_1rm",
      achieved_at: "2026-10-26T22:58:00.000Z"
    },
    previous_period_delta_pct: { volume: 1233.3, workouts: 400, adherence: 0 },
    muscle_balance: [
      { muscle: "lower_back", share_pct: 45.2 },
      { muscle: "hamstrings", share_pct: 18.3 },
      { muscle: "traps", share_pct: 12.1 },
      { muscle: "forearms", share_pct: 9.4 },
      { muscle: "abductors", share_pct: 8 },
      { muscle: "adductors", share_pct: 7 },
      // code outside the translated 20 keys: must fall back, not crash (seed.ts toMuscle)
      { muscle: "other", share_pct: 5 }
    ],
    // Every shape the insight generator can emit at once. muscleShare carries a
    // raw muscle code, so it also covers codes missing from the message file.
    insights: [
      { key: "volumeUp", params: { pct: 1233.3 } },
      { key: "muscleShare", params: { muscle: "lower_back", pct: 45.2 } },
      { key: "noSessions", params: {} },
      { key: "noProgram", params: {} }
    ]
  },
  volume: {
    // 13 bars at ?range=3m is the contract max
    series: weeks("2026-07-27", 13, (i) => ({
      volume_kg: i === 11 ? 1840.5 : 14200 + ((i * 977) % 4200),
      working_sets: 90 + ((i * 13) % 60)
    })),
    // rebound after a layoff: 24,080 vs 1,840
    insight: { key: "volumeUp", params: { pct: 1210.9 }, delta_pct: 1210.9 }
  },
  // 12 weeks is what the dashboard requests (dashboard-overview.tsx:65)
  calendar: {
    days: days("2026-08-03", 84, (i) => ({
      volume_kg: i % 7 === 2 ? 12345.6 : 0,
      intensity: i % 7 === 2 ? 4 : i % 7 === 3 ? 1 : 0
    }))
  },
  active: { id: "wkt_w", title: "Hypertrophy Upper Body Maximum Pump Session Volume", total_sets: 24 },
  program: {
    id: "prg_w",
    // program name, 80-char schema limit (phase3-validation.ts:101)
    name: "Hypertrophy Block for Advanced Athletes — Push Pull Legs with Deload Protoc",
    goal: "gain_muscle", // NOT in profile.goals -> goalMismatch banner
    status: "active",
    completion_pct: 104.2 // extra sessions logged beyond plan
  },
  profile: { goals: ["strength"], days_per_week: 7, equipment: ["barbell", "dumbbell", "cable"] }
};

// --- Empty: zero items / no-results states ---
const empty: Fixture = {
  label: "Empty",
  name: "J",
  unitSystem: "metric",
  login: { status: 401, body: { error: { code: "SOME_FUTURE_CODE_WITHOUT_TRANSLATION" } }, autoSubmit: true },
  loginPrefill: { email: "j@example.com" },
  summary: {
    weekly_logged_workouts: 0,
    volume_7d_kg: 0,
    volume_30d_kg: 0,
    current_streak: 0,
    adherence_current_week: null,
    total_prs: 0,
    last_pr: null,
    previous_period_delta_pct: { volume: 0, workouts: 0, adherence: 0 },
    muscle_balance: [],
    insights: []
  },
  volume: { series: [], insight: { key: "volumeCollecting", params: {}, delta_pct: 0 } },
  calendar: { days: [] },
  active: null,
  program: null,
  profile: { goals: [], days_per_week: null, equipment: [] }
};

// --- One: every count at exactly 1 (pluralization) ---
const one: Fixture = {
  label: "One",
  name: "Jo",
  unitSystem: "metric",
  login: { status: 401, body: { error: { code: "INVALID_CREDENTIALS" } }, autoSubmit: true },
  loginPrefill: { email: "jo@example.com" },
  summary: {
    weekly_logged_workouts: 1,
    volume_7d_kg: 980.5,
    volume_30d_kg: 980.5,
    current_streak: 1,
    adherence_current_week: 1,
    total_prs: 1,
    last_pr: {
      exercise_name: "Dumbbell Curl",
      value: 20,
      unit: "est_1rm",
      achieved_at: "2026-10-26T08:00:00.000Z"
    },
    previous_period_delta_pct: { volume: 0, workouts: 0, adherence: 0 },
    muscle_balance: [{ muscle: "biceps", share_pct: 100 }],
    insights: [{ key: "noProgram", params: {} }]
  },
  volume: {
    series: weeks("2026-10-26", 1, () => ({ volume_kg: 980.5, working_sets: 14 })),
    insight: { key: "volumeCollecting", params: {}, delta_pct: 0 }
  },
  calendar: { days: days("2026-08-03", 84, (i) => ({ volume_kg: i === 83 ? 980.5 : 0, intensity: i === 83 ? 3 : 0 })) },
  active: { id: "wkt_o", title: "Full Body", total_sets: 1 },
  program: {
    id: "prg_o",
    name: "Intro",
    goal: "general_fitness",
    status: "active",
    completion_pct: 1
  },
  profile: { goals: ["general_fitness"], days_per_week: 1, equipment: ["dumbbell"] }
};

// --- Huge: realistic contract maximums (26w calendar cap: phase4-validation.ts:156) ---
const huge: Fixture = {
  label: "Max",
  name: "bartholomew.fitzgerald@northwindindustriesholdingsinternational.example.com", // displayName null -> email fallback (dashboard/page.tsx:20), email max 254 (shared/auth.ts:19); domain has no break opportunity
  unitSystem: "imperial",
  login: { status: 401, body: { error: { code: "INVALID_CREDENTIALS" } }, autoSubmit: true },
  loginPrefill: { email: "bartholomew.fitzgerald@northwind-industries-holdings.example.com" },
  summary: {
    weekly_logged_workouts: 14,
    volume_7d_kg: 987654.32, // Decimal(12,2) allows it; strength-sport loggers get here via imports
    volume_30d_kg: 3987654.32,
    current_streak: 1095,
    adherence_current_week: 1,
    total_prs: 12840,
    last_pr: {
      exercise_name:
        "Barbell Romanian Deadlift from Deficit with Reverse Band Accommodating Chains Plus Paused Reset",
      value: 420.25,
      unit: "est_1rm",
      achieved_at: "2026-10-27T23:59:59.999Z"
    },
    previous_period_delta_pct: { volume: 9999.9, workouts: 9999.9, adherence: 0 },
    muscle_balance: [
      { muscle: "lower_back", share_pct: 45.2 },
      { muscle: "hamstrings", share_pct: 18.3 },
      { muscle: "traps", share_pct: 12.1 },
      { muscle: "forearms", share_pct: 9.4 },
      { muscle: "abductors", share_pct: 8 },
      { muscle: "adductors", share_pct: 7 }
    ],
    insights: [
      { key: "volumeUp", params: { pct: 9999.9 } },
      { key: "muscleShare", params: { muscle: "lower_back", pct: 45.2 } },
      { key: "noSessions", params: {} },
      { key: "noProgram", params: {} }
    ]
  },
  volume: {
    series: weeks("2026-07-27", 13, (i) => ({
      volume_kg: 30000 + ((i * 3371) % 20000),
      working_sets: 120 + ((i * 17) % 90)
    })),
    insight: { key: "volumeUp", params: { pct: 412.7 }, delta_pct: 412.7 }
  },
  calendar: {
    days: days("2026-05-11", 182, (i) => ({
      volume_kg: i % 2 === 0 ? 22222.2 : 0,
      intensity: i % 2 === 0 ? 4 : 0
    }))
  },
  active: { id: "wkt_h", title: "Hypertrophy Upper Body Maximum Pump Session Volume", total_sets: 42 },
  program: {
    id: "prg_h",
    name: "Hypertrophy Block for Advanced Athletes — Push Pull Legs with Deload Protoc",
    goal: "gain_muscle",
    status: "active",
    completion_pct: 104.2
  },
  profile: { goals: ["strength", "endurance"], days_per_week: 7, equipment: ["barbell", "dumbbell", "cable"] }
};

export const FIXTURES: Record<FixtureName, Fixture> = {
  demo,
  worst,
  empty,
  one,
  huge
};

export const FIXTURE_ORDER: FixtureName[] = ["demo", "worst", "empty", "one", "huge"];