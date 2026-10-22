import { setsByMuscle } from "../stats/volume";
import type { ExerciseMeta, MuscleGroup } from "../types";
import type {
  Program,
  ProgramExercise,
  ProgramSession,
  ProgramWeek,
  SplitType,
  ValidationContext,
  ValidationIssue,
  ValidationResult
} from "./types";

const SPLITS: SplitType[] = [
  "full_body",
  "upper_lower",
  "push_pull_legs",
  "bro_split",
  "custom"
];

const BIG_MUSCLES: MuscleGroup[] = [
  "chest",
  "back",
  "shoulders",
  "quads",
  "hamstrings",
  "glutes"
];

const SPLIT_DAY_RANGE: Record<SplitType, [number, number]> = {
  full_body: [2, 4],
  upper_lower: [2, 4],
  push_pull_legs: [3, 3],
  bro_split: [3, 7],
  custom: [1, 7]
};

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isInt(value: unknown, min: number, max = Number.MAX_SAFE_INTEGER): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;
}

function isNum(value: unknown, min = 0): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= min;
}

function issue(rule: ValidationIssue["rule"], path: string, message: string): ValidationIssue {
  return { rule, path, message };
}

function parseProgram(input: unknown, errors: ValidationIssue[]): Program | null {
  if (!isRecord(input)) {
    errors.push(issue("V-01", "program", "Program must be an object"));
    return null;
  }

  if (!SPLITS.includes(input.splitType as SplitType)) {
    errors.push(issue("V-01", "splitType", "Unknown split type"));
  }
  if (!isInt(input.durationWeeks, 1, 52)) {
    errors.push(issue("V-01", "durationWeeks", "durationWeeks must be 1-52"));
  }
  if (!isInt(input.daysPerWeek, 1, 7)) {
    errors.push(issue("V-01", "daysPerWeek", "daysPerWeek must be 1-7"));
  }
  if (!isNum(input.sessionMinutes, 1)) {
    errors.push(issue("V-01", "sessionMinutes", "sessionMinutes must be positive"));
  }
  if (typeof input.progressionType !== "string") {
    errors.push(issue("V-01", "progressionType", "progressionType is required"));
  }

  if (!Array.isArray(input.weeks) || input.weeks.length === 0) {
    errors.push(issue("V-01", "weeks", "weeks must be a non-empty array"));
    return null;
  }

  if (isInt(input.durationWeeks, 1, 52) && input.weeks.length !== input.durationWeeks) {
    errors.push(issue("V-01", "weeks", "weeks length must equal durationWeeks"));
  }

  const weeks: ProgramWeek[] = [];
  input.weeks.forEach((rawWeek, weekIndex) => {
    const weekPath = `weeks[${weekIndex}]`;
    if (!isRecord(rawWeek)) {
      errors.push(issue("V-01", weekPath, "Week must be an object"));
      return;
    }
    if (!isInt(rawWeek.weekNumber, 1)) {
      errors.push(issue("V-01", `${weekPath}.weekNumber`, "weekNumber must be >= 1"));
    }
    if (rawWeek.isDeload !== undefined && typeof rawWeek.isDeload !== "boolean") {
      errors.push(issue("V-01", `${weekPath}.isDeload`, "isDeload must be boolean"));
    }
    if (rawWeek.volumeMultiplier !== undefined && !isNum(rawWeek.volumeMultiplier, 0)) {
      errors.push(
        issue("V-01", `${weekPath}.volumeMultiplier`, "volumeMultiplier must be >= 0")
      );
    }
    if (!Array.isArray(rawWeek.sessions) || rawWeek.sessions.length === 0) {
      errors.push(issue("V-01", `${weekPath}.sessions`, "sessions must be a non-empty array"));
      return;
    }

    const sessions: ProgramSession[] = [];
    rawWeek.sessions.forEach((rawSession, sessionIndex) => {
      const sessionPath = `${weekPath}.sessions[${sessionIndex}]`;
      if (!isRecord(rawSession)) {
        errors.push(issue("V-01", sessionPath, "Session must be an object"));
        return;
      }
      if (!isInt(rawSession.dayIndex, 1, 7)) {
        errors.push(issue("V-01", `${sessionPath}.dayIndex`, "dayIndex must be 1-7"));
      }
      if (typeof rawSession.name !== "string" || rawSession.name.length === 0) {
        errors.push(issue("V-01", `${sessionPath}.name`, "name is required"));
      }
      if (typeof rawSession.focus !== "string" || rawSession.focus.length === 0) {
        errors.push(issue("V-01", `${sessionPath}.focus`, "focus is required"));
      }
      if (rawSession.estimatedMinutes !== undefined && !isNum(rawSession.estimatedMinutes, 1)) {
        errors.push(
          issue("V-01", `${sessionPath}.estimatedMinutes`, "estimatedMinutes must be positive")
        );
      }
      if (!Array.isArray(rawSession.exercises) || rawSession.exercises.length === 0) {
        errors.push(
          issue("V-01", `${sessionPath}.exercises`, "exercises must be a non-empty array")
        );
        return;
      }

      const exercises: ProgramExercise[] = [];
      rawSession.exercises.forEach((rawExercise, exerciseIndex) => {
        const exercisePath = `${sessionPath}.exercises[${exerciseIndex}]`;
        if (!isRecord(rawExercise)) {
          errors.push(issue("V-01", exercisePath, "Exercise must be an object"));
          return;
        }
        if (typeof rawExercise.exerciseId !== "string" || rawExercise.exerciseId.length === 0) {
          errors.push(issue("V-01", `${exercisePath}.exerciseId`, "exerciseId is required"));
        }
        if (!isInt(rawExercise.position, 0)) {
          errors.push(issue("V-01", `${exercisePath}.position`, "position must be >= 0"));
        }
        if (!isInt(rawExercise.targetSets, 1)) {
          errors.push(issue("V-01", `${exercisePath}.targetSets`, "targetSets must be >= 1"));
        }
        if (!isInt(rawExercise.targetRepsMin, 0)) {
          errors.push(
            issue("V-01", `${exercisePath}.targetRepsMin`, "targetRepsMin must be >= 0")
          );
        }
        if (!isInt(rawExercise.targetRepsMax, 0)) {
          errors.push(
            issue("V-01", `${exercisePath}.targetRepsMax`, "targetRepsMax must be >= 0")
          );
        }
        const repsMin = rawExercise.targetRepsMin;
        const repsMax = rawExercise.targetRepsMax;
        if (isInt(repsMin, 0) && isInt(repsMax, 0) && repsMax < repsMin) {
          errors.push(
            issue(
              "V-01",
              `${exercisePath}.targetRepsMax`,
              "targetRepsMax must be >= targetRepsMin"
            )
          );
        }
        if (!isNum(rawExercise.restSeconds, 0)) {
          errors.push(
            issue("V-01", `${exercisePath}.restSeconds`, "restSeconds must be >= 0")
          );
        }
        if (rawExercise.isWarmup !== undefined && typeof rawExercise.isWarmup !== "boolean") {
          errors.push(issue("V-01", `${exercisePath}.isWarmup`, "isWarmup must be boolean"));
        }
        if (
          rawExercise.supersetGroup !== undefined &&
          !isInt(rawExercise.supersetGroup, 1)
        ) {
          errors.push(
            issue("V-01", `${exercisePath}.supersetGroup`, "supersetGroup must be >= 1")
          );
        }
        if (!isRecord(rawExercise.progression)) {
          // V-13 reports the actionable error; V-01 requires the property shape.
          errors.push(issue("V-01", `${exercisePath}.progression`, "progression is required"));
        }

        exercises.push(rawExercise as unknown as ProgramExercise);
      });

      sessions.push(rawSession as unknown as ProgramSession);
    });

    weeks.push(rawWeek as unknown as ProgramWeek);
  });

  if (errors.some((error) => error.rule === "V-01")) return null;

  return {
    splitType: input.splitType as SplitType,
    durationWeeks: input.durationWeeks as number,
    daysPerWeek: input.daysPerWeek as number,
    sessionMinutes: input.sessionMinutes as number,
    progressionType: input.progressionType as Program["progressionType"],
    weeks
  };
}

function averageReps(exercise: ProgramExercise) {
  return (exercise.targetRepsMin + exercise.targetRepsMax) / 2;
}

function workingSets(session: { exercises: ProgramExercise[] }) {
  return session.exercises.filter((exercise) => !exercise.isWarmup);
}

function weekVolume(week: ProgramWeek) {
  const multiplier = week.volumeMultiplier ?? 1;
  return (
    week.sessions.reduce(
      (total, session) =>
        total +
        workingSets(session).reduce(
          (sessionTotal, exercise) =>
            sessionTotal + exercise.targetSets * averageReps(exercise),
          0
        ),
      0
    ) * multiplier
  );
}

export function validateProgram(
  input: unknown,
  context: ValidationContext
): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const program = parseProgram(input, errors);
  if (!program) return { valid: false, errors, warnings };

  const catalog = new Map<string, ExerciseMeta>(
    context.catalog.map((exercise) => [exercise.id, exercise])
  );
  const available = new Set(["bodyweight", ...context.availableEquipment]);
  const injuries = new Set(context.injuries ?? []);

  program.weeks.forEach((week, weekIndex) => {
    const weekPath = `weeks[${weekIndex}]`;
    const sessionCounts = new Map<string, number[]>();

    week.sessions.forEach((session, sessionIndex) => {
      const sessionPath = `${weekPath}.sessions[${sessionIndex}]`;

      // V-05
      const totalSets = workingSets(session).reduce(
        (total, exercise) => total + exercise.targetSets,
        0
      );
      if (totalSets > 25) {
        errors.push(issue("V-05", sessionPath, `Session has ${totalSets} working sets (max 25)`));
      }

      // V-07
      const seconds = session.exercises.reduce(
        (total, exercise) =>
          total + exercise.targetSets * (averageReps(exercise) * 3.5 + exercise.restSeconds),
        0
      );
      const estimatedMinutes = session.estimatedMinutes ?? program.sessionMinutes;
      if (seconds > estimatedMinutes * 60 * 1.15) {
        errors.push(
          issue(
            "V-07",
            sessionPath,
            `Estimated ${Math.round(seconds / 60)} min exceeds ${estimatedMinutes} min + 15%`
          )
        );
      }

      // V-08 bookkeeping
      const days = sessionCounts.get(session.focus) ?? [];
      days.push(session.dayIndex);
      sessionCounts.set(session.focus, days);

      // V-10
      const seen = new Map<string, number | undefined>();
      for (const exercise of workingSets(session)) {
        if (!seen.has(exercise.exerciseId)) {
          seen.set(exercise.exerciseId, exercise.supersetGroup);
          continue;
        }
        const previous = seen.get(exercise.exerciseId);
        if (
          exercise.supersetGroup !== undefined &&
          exercise.supersetGroup === previous
        ) {
          continue;
        }
        errors.push(
          issue(
            "V-10",
            sessionPath,
            `Duplicate exercise ${exercise.exerciseId} in one session`
          )
        );
      }

      for (const exercise of session.exercises) {
        const meta = catalog.get(exercise.exerciseId);
        if (!meta) {
          errors.push(
            issue(
              "V-01",
              `${sessionPath}.exercises`,
              `Unknown exercise ${exercise.exerciseId}`
            )
          );
          continue;
        }

        // V-02
        const missing = meta.equipment.filter((item) => !available.has(item));
        if (missing.length > 0) {
          errors.push(
            issue(
              "V-02",
              `${sessionPath}.exercises`,
              `${meta.id} needs ${missing.join(", ")}`
            )
          );
        }

        // V-03
        const contraindicated = meta.contraindications.filter((area) => injuries.has(area));
        if (contraindicated.length > 0) {
          errors.push(
            issue(
              "V-03",
              `${sessionPath}.exercises`,
              `${meta.id} conflicts with injury: ${contraindicated.join(", ")}`
            )
          );
        }

        // V-12 recommendation, not an error.
        const minimumRest = meta.kind === "compound" ? 30 : 45;
        if (exercise.restSeconds < minimumRest) {
          warnings.push(
            issue(
              "V-12",
              `${sessionPath}.exercises`,
              `${meta.id} rest ${exercise.restSeconds}s < ${minimumRest}s`
            )
          );
        }

        // V-13
        validateProgression(exercise, `${sessionPath}.exercises`, errors);
      }
    });

    // V-08
    for (const [focus, days] of sessionCounts) {
      days.sort((a, b) => a - b);
      for (let index = 1; index < days.length; index += 1) {
        if (days[index]! - days[index - 1]! < 2) {
          errors.push(
            issue(
              "V-08",
              weekPath,
              `${focus} sessions need 48h recovery (days ${days[index - 1]} and ${days[index]})`
            )
          );
        }
      }
    }

    // V-09
    const [minDays, maxDays] = SPLIT_DAY_RANGE[program.splitType];
    if (program.daysPerWeek < minDays || program.daysPerWeek > maxDays) {
      errors.push(
        issue(
          "V-09",
          "daysPerWeek",
          `${program.splitType} allows ${minDays}-${maxDays} days`
        )
      );
    }
    if (week.sessions.length !== program.daysPerWeek) {
      errors.push(
        issue(
          "V-09",
          `${weekPath}.sessions`,
          `Expected ${program.daysPerWeek} sessions, got ${week.sessions.length}`
        )
      );
    }

    // V-04
    const muscleSets = setsByMuscle(
      workingSets({
        exercises: week.sessions.flatMap((session) => session.exercises)
      }).map((exercise) => ({
        primaryMuscle: catalog.get(exercise.exerciseId)?.primaryMuscle ?? "full_body",
        secondaryMuscles: catalog.get(exercise.exerciseId)?.secondaryMuscles ?? [],
        workingSets: exercise.targetSets
      }))
    );
    for (const muscle of BIG_MUSCLES) {
      const total = muscleSets[muscle] ?? 0;
      if (total < 8 || total > 22) {
        errors.push(
          issue(
            "V-04",
            weekPath,
            `${muscle} has ${total} weekly sets (allowed 8-22)`
          )
        );
      }
    }
  });

  // V-06 across weeks.
  for (let index = 1; index < program.weeks.length; index += 1) {
    const previous = weekVolume(program.weeks[index - 1]!);
    const current = weekVolume(program.weeks[index]!);
    if (previous > 0 && current > previous * 1.15 + 0.001) {
      errors.push(
        issue(
          "V-06",
          `weeks[${index}]`,
          `Weekly volume increase ${(((current - previous) / previous) * 100).toFixed(1)}% exceeds 15%`
        )
      );
    }
  }

  // V-08 across week boundary (same focus, 48h).
  for (let index = 1; index < program.weeks.length; index += 1) {
    const previous = program.weeks[index - 1]!;
    const current = program.weeks[index]!;
    for (const focus of new Set(previous.sessions.map((session) => session.focus))) {
      const previousDays = previous.sessions
        .filter((session) => session.focus === focus)
        .map((session) => session.dayIndex);
      const currentDays = current.sessions
        .filter((session) => session.focus === focus)
        .map((session) => session.dayIndex);
      if (previousDays.length === 0 || currentDays.length === 0) continue;

      const last = Math.max(...previousDays);
      const first = Math.min(...currentDays);
      if (7 - last + first < 2) {
        errors.push(
          issue(
            "V-08",
            `weeks[${index}]`,
            `${focus} sessions are less than 48h apart across weeks`
          )
        );
      }
    }
  }

  // V-11
  if (context.isStrength !== false) {
    const hasWarmup = program.weeks.some((week) =>
      week.sessions.some((session) =>
        session.exercises.some((exercise) => exercise.isWarmup === true)
      )
    );
    if (!hasWarmup) {
      errors.push(issue("V-11", "weeks", "Strength program needs at least one warm-up set"));
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

function validateProgression(
  exercise: ProgramExercise,
  path: string,
  errors: ValidationIssue[]
) {
  const progression = exercise.progression;
  if (!progression || typeof progression.type !== "string") {
    errors.push(issue("V-13", path, "Missing progression rule"));
    return;
  }

  switch (progression.type) {
    case "none":
      return;
    case "rpe_target":
      if (
        !(
          typeof exercise.targetRpe === "number" &&
          exercise.targetRpe >= 6 &&
          exercise.targetRpe <= 10
        )
      ) {
        errors.push(issue("V-13", path, "rpe_target needs targetRpe between 6 and 10"));
      }
      return;
    case "percent_1rm":
      if (
        !(
          typeof exercise.targetPercent1rm === "number" &&
          exercise.targetPercent1rm > 0 &&
          exercise.targetPercent1rm <= 100
        )
      ) {
        errors.push(
          issue("V-13", path, "percent_1rm needs targetPercent1rm between 1 and 100")
        );
      }
      return;
    case "linear":
      if (!(typeof progression.incrementKg === "number" && progression.incrementKg > 0)) {
        errors.push(issue("V-13", path, "linear progression needs incrementKg > 0"));
      }
      return;
    case "double_progression":
      if (
        !(typeof progression.incrementReps === "number" && progression.incrementReps > 0) ||
        !(typeof progression.maxReps === "number" && progression.maxReps >= exercise.targetRepsMax)
      ) {
        errors.push(
          issue(
            "V-13",
            path,
            "double_progression needs incrementReps > 0 and maxReps >= targetRepsMax"
          )
        );
      }
      return;
    default:
      errors.push(issue("V-13", path, `Unknown progression type ${progression.type}`));
  }
}
