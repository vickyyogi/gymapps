import { describe, expect, it } from "vitest";
import {
  appendPersonalRecords,
  brzyckiOneRm,
  checkQuota,
  detectPersonalRecords,
  estimateOneRm,
  evaluateAdherenceDrop,
  evaluateDeload,
  evaluateImbalance,
  evaluatePlateau,
  evaluateStaleProgram,
  evaluateOvertrainingRisk,
  evaluatePrMilestone,
  evaluateMissingEquipment,
  evaluateFrequencyLow,
  generateFallbackProgram,
  setsByMuscle,
  totalVolume,
  fromKg,
  kgToLb,
  lbToKg,
  toKg,
  weightUnitLabel,
  validateProgram,
  weeklyAdherence,
  type BodyArea,
  type EquipmentType,
  type ExerciseMeta,
  type GenerateProgramInput,
  type MuscleGroup,
  type Program,
  type SplitType,
  type ValidationContext
} from "./index";

const BIG_MUSCLES: MuscleGroup[] = [
  "chest",
  "back",
  "shoulders",
  "quads",
  "hamstrings",
  "glutes"
];

function catalog(): ExerciseMeta[] {
  const secondary: Partial<Record<MuscleGroup, MuscleGroup[]>> = {
    chest: ["shoulders", "triceps"],
    back: ["biceps"],
    shoulders: ["triceps"],
    quads: ["glutes"],
    hamstrings: ["glutes"],
    glutes: ["hamstrings"]
  };

  return BIG_MUSCLES.flatMap((muscle) =>
    Array.from({ length: 4 }, (_, index) => ({
      id: `${muscle}-${index}`,
      name: `${muscle} ${index}`,
      primaryMuscle: muscle,
      secondaryMuscles: secondary[muscle] ?? [],
      equipment: ["bodyweight"] as EquipmentType[],
      kind: "compound" as const,
      contraindications: [] as BodyArea[]
    }))
  );
}

function context(overrides: Partial<ValidationContext> = {}): ValidationContext {
  return {
    catalog: catalog(),
    availableEquipment: [],
    injuries: [],
    ...overrides
  };
}

function input(splitType: SplitType, daysPerWeek = 3): GenerateProgramInput {
  return {
    splitType,
    daysPerWeek,
    durationWeeks: 2,
    sessionMinutes: 45,
    availableEquipment: [],
    injuries: [],
    catalog: catalog()
  };
}

function generated(splitType: SplitType = "full_body", daysPerWeek = 3): Program {
  return generateFallbackProgram(input(splitType, daysPerWeek));
}

function clone(program: Program): Program {
  return structuredClone(program);
}

function working(program: Program, week = 0, session = 0) {
  return program.weeks[week]!.sessions[session]!.exercises.filter(
    (exercise) => !exercise.isWarmup
  );
}

describe("stats", () => {
  it("estimates one rep max with Epley and Brzycki, skipping >12 reps", () => {
    expect(estimateOneRm(80, 5)).toBe(93.33);
    expect(brzyckiOneRm(80, 5)).toBe(90);
    expect(estimateOneRm(80, 13)).toBeNull();
    expect(estimateOneRm(0, 5)).toBeNull();
  });

  it("weights primary and secondary muscles", () => {
    const sets = setsByMuscle([
      {
        primaryMuscle: "chest",
        secondaryMuscles: ["shoulders", "triceps"],
        workingSets: 4
      }
    ]);

    expect(sets.chest).toBe(4);
    expect(sets.shoulders).toBe(2);
    expect(sets.triceps).toBe(2);
  });

  it("excludes warm-up sets from total volume", () => {
    expect(
      totalVolume([
        { weightKg: 100, reps: 5 },
        { weightKg: 50, reps: 10, isWarmup: true }
      ])
    ).toBe(500);
  });

  it("detects four record types without overwriting history", () => {
    const records = detectPersonalRecords({ weightKg: 80, reps: 5 }, {});
    expect(records.map((record) => record.type).sort()).toEqual([
      "est_1rm",
      "max_reps",
      "max_volume",
      "max_weight"
    ]);

    const tied = detectPersonalRecords(
      { weightKg: 80, reps: 5 },
      { max_weight: 80, max_reps: 10, max_volume: 500, est_1rm: 95 }
    );
    expect(tied).toEqual([]);

    const old = [{ type: "max_weight" as const, value: 70, weightKg: 70, reps: 5 }];
    const history = appendPersonalRecords(old, records);
    expect(history).toHaveLength(5);
    expect(history[0]).toBe(old[0]);
  });

  it("does not count future days as adherence misses", () => {
    const sessions = [
      { dayIndex: 1, completed: true },
      { dayIndex: 3, completed: false },
      { dayIndex: 5, completed: true },
      { dayIndex: 7, completed: false }
    ];

    expect(weeklyAdherence(sessions, 3)).toBe(0.5);
    expect(weeklyAdherence(sessions, 2)).toBe(1);
    expect(weeklyAdherence(sessions, 7)).toBe(0.5);
  });
});

describe("program validator", () => {
  it("generates programs that pass V-01..V-13", () => {
    const cases: Array<[SplitType, number]> = [
      ["full_body", 2],
      ["full_body", 3],
      ["full_body", 4],
      ["upper_lower", 4],
      ["push_pull_legs", 3],
      ["bro_split", 3],
      ["custom", 3]
    ];

    for (const [split, days] of cases) {
      const result = validateProgram(generated(split, days), context());
      expect(result.errors, `${split} ${days}`).toEqual([]);
      expect(result.valid).toBe(true);
    }
  });

  it("V-01 rejects incomplete structure", () => {
    const result = validateProgram(
      { weeks: [{ sessions: [] }] },
      context()
    );
    expect(result.errors.some((error) => error.rule === "V-01")).toBe(true);
  });

  it("V-02 rejects unavailable equipment", () => {
    const meta = catalog();
    meta[0]!.equipment = ["barbell"];
    const result = validateProgram(
      generated(),
      context({ catalog: meta, availableEquipment: [] })
    );
    expect(result.errors.some((error) => error.rule === "V-02")).toBe(true);
  });

  it("V-03 rejects exercises that conflict with injuries", () => {
    const meta = catalog();
    meta[0]!.contraindications = ["knee"];
    const result = validateProgram(
      generated(),
      context({ catalog: meta, injuries: ["knee"] })
    );
    expect(result.errors.some((error) => error.rule === "V-03")).toBe(true);
  });

  it("V-04 rejects weekly volume outside 8-22 sets", () => {
    const program = clone(generated());
    for (const exercise of working(program, 0, 0)) {
      exercise.targetSets = 23;
    }
    const result = validateProgram(program, context());
    expect(result.errors.some((error) => error.rule === "V-04")).toBe(true);
  });

  it("V-05 rejects more than 25 working sets per session", () => {
    const program = clone(generated());
    working(program, 0, 0)[0]!.targetSets = 26;
    const result = validateProgram(program, context());
    expect(result.errors.some((error) => error.rule === "V-05")).toBe(true);
  });

  it("V-06 rejects volume jumps above 15%", () => {
    const program = clone(generated());
    program.weeks[1]!.volumeMultiplier = 1.2;
    const result = validateProgram(program, context());
    expect(result.errors.some((error) => error.rule === "V-06")).toBe(true);
  });

  it("V-07 rejects sessions over the duration tolerance", () => {
    const program = clone(generated());
    program.weeks[0]!.sessions[0]!.estimatedMinutes = 1;
    const result = validateProgram(program, context());
    expect(result.errors.some((error) => error.rule === "V-07")).toBe(true);
  });

  it("V-08 rejects similar sessions less than 48h apart", () => {
    const program = clone(generated());
    program.weeks[0]!.sessions[1]!.dayIndex = 2;
    const result = validateProgram(program, context());
    expect(result.errors.some((error) => error.rule === "V-08")).toBe(true);
  });

  it("V-09 rejects an invalid split structure", () => {
    const program = clone(generated());
    program.daysPerWeek = 4;
    const result = validateProgram(program, context());
    expect(result.errors.some((error) => error.rule === "V-09")).toBe(true);
  });

  it("V-10 rejects duplicate exercises in one session", () => {
    const program = clone(generated());
    const exercises = program.weeks[0]!.sessions[0]!.exercises;
    exercises[2]!.exerciseId = exercises[1]!.exerciseId;
    const result = validateProgram(program, context());
    expect(result.errors.some((error) => error.rule === "V-10")).toBe(true);
  });

  it("V-11 requires a warm-up set for strength programs", () => {
    const program = clone(generated());
    for (const week of program.weeks) {
      for (const session of week.sessions) {
        session.exercises = session.exercises.filter((exercise) => !exercise.isWarmup);
      }
    }
    const result = validateProgram(program, context());
    expect(result.errors.some((error) => error.rule === "V-11")).toBe(true);
  });

  it("V-12 reports short rest as a warning, not an error", () => {
    const program = clone(generated());
    working(program, 0, 0)[0]!.restSeconds = 10;
    const result = validateProgram(program, context());
    expect(result.valid).toBe(true);
    expect(result.warnings.some((warning) => warning.rule === "V-12")).toBe(true);
  });

  it("V-13 rejects invalid progression rules", () => {
    const program = clone(generated());
    working(program, 0, 0)[0]!.progression = { type: "bogus" } as never;
    const result = validateProgram(program, context());
    expect(result.errors.some((error) => error.rule === "V-13")).toBe(true);
  });
});

describe("rules", () => {
  it("flags a flat e1RM plateau after enough completed sets", () => {
    expect(
      evaluatePlateau({ estimatedOneRm: [100, 100.5, 100.2], plannedSets: 10, completedSets: 9 })
    ).toMatchObject({ rule: "plateau_detection", severity: "P1" });
  });

  it("AC-10-01 suggests deload after three >20% volume jumps", () => {
    const result = evaluateDeload({ weeklyVolumes: [100, 125, 155, 195] });
    expect(result).toMatchObject({ rule: "deload_suggestion", severity: "P1" });
    expect(result?.evidence.reason).toBe("volume_surge");
  });

  it("flags push/pull imbalance for two weeks", () => {
    expect(evaluateImbalance({ weeklyPushPullRatios: [0.5, 0.6] })).toMatchObject({
      rule: "volume_imbalance",
      severity: "P2"
    });
  });

  it("flags adherence below 60%", () => {
    expect(
      evaluateAdherenceDrop({ plannedSessions: 5, completedSessions: 2 })
    ).toMatchObject({ rule: "adherence_drop", severity: "P2" });
  });

  it("flags stale active programs, not drafts", () => {
    const now = new Date("2026-10-22T00:00:00Z");
    const activatedAt = new Date("2026-07-01T00:00:00Z");
    const base = {
      status: "active" as const,
      durationWeeks: 8,
      activatedAt,
      lastCompletedAt: new Date("2026-07-02T00:00:00Z"),
      now
    };

    expect(evaluateStaleProgram(base)).toMatchObject({ rule: "stale_program" });
    expect(evaluateStaleProgram({ ...base, status: "draft" })).toBeNull();
  });

  it("detects overtraining risk on 3 consecutive 20%+ volume jumps", () => {
    expect(
      evaluateOvertrainingRisk({ weeklyVolumes: [1000, 1300, 1600, 2000] })
    ).toMatchObject({ rule: "overtraining_risk", severity: "P1" });
    expect(
      evaluateOvertrainingRisk({ weeklyVolumes: [1000, 1100, 1200, 1300] })
    ).toBeNull();
  });

  it("detects pr milestone when new prs are achieved", () => {
    expect(
      evaluatePrMilestone({
        recentPrs: [{ exerciseId: "ex_1", recordType: "1rm", value: 120 }]
      })
    ).toMatchObject({ rule: "pr_milestone", severity: "P3" });
    expect(evaluatePrMilestone({ recentPrs: [] })).toBeNull();
  });

  it("detects missing equipment conflicts in active program", () => {
    const conflict = evaluateMissingEquipment({
      programExercises: [
        { exerciseId: "ex_1", exerciseName: "Barbell Squat", equipment: ["barbell"] },
        { exerciseId: "ex_2", exerciseName: "Push up", equipment: ["bodyweight"] }
      ],
      userEquipment: ["dumbbell"]
    });
    expect(conflict).toMatchObject({ rule: "missing_equipment_conflict", severity: "P2" });
    expect(conflict?.evidence.conflict_count).toBe(1);

    const ok = evaluateMissingEquipment({
      programExercises: [{ exerciseId: "ex_2", equipment: ["bodyweight"] }],
      userEquipment: []
    });
    expect(ok).toBeNull();
  });

  it("detects low frequency when session counts are low", () => {
    expect(
      evaluateFrequencyLow({ weeklySessionCounts: [1, 1, 0], targetDaysPerWeek: 4 })
    ).toMatchObject({ rule: "frequency_low", severity: "P3" });
    expect(
      evaluateFrequencyLow({ weeklySessionCounts: [4, 3, 4], targetDaysPerWeek: 4 })
    ).toBeNull();
  });
});

describe("quota", () => {
  const now = Date.UTC(2026, 9, 22, 12);

  it("blocks generate after 5 per day", () => {
    const usage = Array.from({ length: 5 }, (_, index) => now - index * 1000);
    const result = checkQuota(usage, { perDay: 5 }, now);
    expect(result.allowed).toBe(false);
    expect(result.blockedBy).toBe("day");
    expect(result.remaining.day).toBe(0);
  });

  it("blocks chat after 30 per hour but still reports daily room", () => {
    const usage = Array.from({ length: 30 }, (_, index) => now - index * 1000);
    const result = checkQuota(usage, { perHour: 30, perDay: 200 }, now);
    expect(result.allowed).toBe(false);
    expect(result.blockedBy).toBe("hour");
    expect(result.remaining.day).toBe(170);
  });

  it("allows usage below every window", () => {
    const result = checkQuota([now - 1000], { perMinute: 20, perDay: 5 }, now);
    expect(result.allowed).toBe(true);
    expect(result.retryAfterSeconds).toBe(0);
    expect(kgToLb(100)).toBe(220.5);
    expect(lbToKg(220.46)).toBe(100);
    expect(fromKg(80, "metric")).toBe(80);
    expect(fromKg(80, "imperial")).toBe(176.4);
    expect(toKg(176.4, "imperial")).toBe(80.01);
    expect(toKg(80, "metric")).toBe(80);
    expect(weightUnitLabel("metric")).toBe("kg");
    expect(weightUnitLabel("imperial")).toBe("lb");
  });
});
