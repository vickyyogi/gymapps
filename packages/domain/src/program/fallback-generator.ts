import type { BodyArea, EquipmentType, ExerciseMeta, MuscleGroup } from "../types";
import { SPLIT_DAY_RANGE } from "./validator";
import type {
  Program,
  ProgramExercise,
  ProgramSession,
  Progression,
  SplitType
} from "./types";

export type GenerateProgramInput = {
  splitType: SplitType;
  daysPerWeek: number;
  durationWeeks: number;
  sessionMinutes: number;
  availableEquipment: EquipmentType[];
  injuries?: BodyArea[];
  catalog: ExerciseMeta[];
};

type DayPlan = {
  name: string;
  focus: string;
  muscles: MuscleGroup[];
};

const FULL_BODY_MUSCLES: MuscleGroup[] = [
  "quads",
  "hamstrings",
  "glutes",
  "chest",
  "back",
  "shoulders"
];

const LOWER_MUSCLES: MuscleGroup[] = [
  "quads",
  "quads",
  "hamstrings",
  "hamstrings",
  "glutes",
  "glutes"
];

const LINEAR: Progression = { type: "linear", incrementKg: 2.5 };

function scheduleFor(days: number): number[] {
  if (days === 1) return [1];
  if (days === 2) return [1, 4];
  if (days === 3) return [1, 3, 5];
  if (days === 4) return [1, 2, 4, 5];
  if (days === 5) return [1, 2, 3, 5, 6];
  if (days === 6) return [1, 2, 3, 4, 6, 7];
  return [1, 2, 3, 4, 5, 6, 7];
}

function broPlans(days: number): DayPlan[] {
  const plans: DayPlan[] = [
    {
      name: "Chest",
      focus: "chest",
      muscles: ["chest", "chest", "chest", "shoulders"]
    },
    { name: "Back", focus: "back", muscles: ["back", "back", "back", "back"] },
    {
      name: "Legs",
      focus: "legs",
      muscles: ["quads", "quads", "hamstrings", "hamstrings", "glutes", "glutes"]
    },
    {
      name: "Shoulders",
      focus: "shoulders",
      muscles: ["shoulders", "shoulders", "shoulders"]
    },
    {
      name: "Legs A",
      focus: "legs_a",
      muscles: ["quads", "quads", "quads", "glutes"]
    },
    {
      name: "Legs B",
      focus: "legs_b",
      muscles: ["hamstrings", "hamstrings", "hamstrings", "glutes", "glutes"]
    },
    {
      name: "Arms",
      focus: "arms",
      muscles: ["biceps", "biceps", "triceps", "triceps"]
    }
  ];

  if (days === 3) return [plans[0]!, plans[1]!, plans[2]!];
  if (days === 4) return [plans[0]!, plans[1]!, plans[3]!, plans[2]!];
  if (days === 5) return [plans[0]!, plans[1]!, plans[3]!, plans[4]!, plans[5]!];
  if (days === 6) {
    return [plans[0]!, plans[1]!, plans[3]!, plans[0]!, plans[5]!, plans[6]!].map(
      (plan, index) =>
        index === 3
          ? { ...plan, name: "Legs C", focus: "legs_c", muscles: ["quads", "quads", "hamstrings"] }
          : plan
    );
  }
  return [plans[0]!, plans[1]!, plans[3]!, plans[4]!, plans[5]!, plans[6]!, {
    name: "Core",
    focus: "core",
    muscles: ["abs", "obliques", "core"]
  }];
}

function plansFor(splitType: SplitType, days: number): DayPlan[] {
  if (splitType === "upper_lower") {
    // ponytail: 2 hari/minggu = 1 sesi upper. V-05 caps that session at 25 sets,
    // so a sparse catalog (no primary back/shoulders work) can't reach V-04's
    // 8-set floor. Upgrade path: extend the catalog or relax V-04 for 2-day splits.
    return Array.from({ length: days }, (_, index) =>
      index % 2 === 0
        ? {
            name: `Upper ${Math.floor(index / 2) + 1}`,
            focus: "upper",
            muscles: ["chest", "chest", "back", "back", "shoulders", "shoulders"]
          }
        : {
            name: `Lower ${Math.floor(index / 2) + 1}`,
            focus: "lower",
            muscles: LOWER_MUSCLES
          }
    );
  }

  if (splitType === "push_pull_legs") {
    return [
      {
        name: "Push",
        focus: "push",
        muscles: ["chest", "chest", "shoulders", "shoulders"]
      },
      { name: "Pull", focus: "pull", muscles: ["back", "back", "back", "back"] },
      { name: "Legs", focus: "legs", muscles: LOWER_MUSCLES }
    ];
  }

  if (splitType === "bro_split" || (splitType === "custom" && days >= 5)) {
    return broPlans(days);
  }

  // full_body and custom (2-4 days) use the same full-body movement pattern.
  return Array.from({ length: days }, (_, index) => ({
    name: days === 1 ? "Full Body" : `Full Body ${index + 1}`,
    focus: days === 4 ? (index % 2 === 0 ? "full_body_a" : "full_body_b") : "full_body",
    muscles: FULL_BODY_MUSCLES
  }));
}

export function generateFallbackProgram(input: GenerateProgramInput): Program {
  const { splitType, daysPerWeek, durationWeeks, sessionMinutes, catalog } = input;
  if (!Number.isInteger(durationWeeks) || durationWeeks < 1 || durationWeeks > 52) {
    throw new Error("durationWeeks must be 1-52");
  }
  if (!Number.isInteger(daysPerWeek) || daysPerWeek < 1 || daysPerWeek > 7) {
    throw new Error("fallback generator supports 1-7 days per week");
  }
  const [minDays, maxDays] = SPLIT_DAY_RANGE[splitType];
  if (daysPerWeek < minDays || daysPerWeek > maxDays) {
    throw new Error(`${splitType} requires ${minDays}-${maxDays} days`);
  }

  const schedule = scheduleFor(daysPerWeek);
  const plans = plansFor(splitType, daysPerWeek);
  const available = new Set<string>(["bodyweight", ...input.availableEquipment]);
  const injuries = new Set(input.injuries ?? []);
  const sets = 2;
  const sortedCatalog = [...catalog].sort((a, b) => a.id.localeCompare(b.id));

  function pick(muscle: MuscleGroup, used: Set<string>): ExerciseMeta | null {
    // ponytail: sparse catalogs (bodyweight-only) often have no primary exercise
    // for a muscle. Pick any unused compound that trains it, then balance sets.
    const candidates = sortedCatalog
      .filter(
        (exercise) =>
          !used.has(exercise.id) &&
          exercise.equipment.every((item) => available.has(item)) &&
          exercise.contraindications.every((area) => !injuries.has(area))
      )
      .map((exercise) => {
        const score =
          exercise.primaryMuscle === muscle
            ? 3
            : exercise.secondaryMuscles.includes(muscle)
              ? 2
              : 0;
        return { exercise, score };
      })
      .filter((item) => item.score > 0)
      .sort(
        (a, b) =>
          b.score - a.score ||
          Number(b.exercise.kind === "compound") - Number(a.exercise.kind === "compound") ||
          a.exercise.id.localeCompare(b.exercise.id)
      );

    const found = candidates[0]?.exercise;
    if (found) used.add(found.id);
    return found ?? null;
  }

  const weeks = Array.from({ length: durationWeeks }, (_, weekIndex) => ({
    weekNumber: weekIndex + 1,
    isDeload: false,
    volumeMultiplier: 1,
    sessions: schedule.map((dayIndex, sessionIndex) => {
      const plan = plans[sessionIndex]!;
      const used = new Set<string>();
      const working = plan.muscles
        .map((muscle) => pick(muscle, used))
        .filter((exercise): exercise is ExerciseMeta => exercise !== null)
        .map(
          (exercise, index): ProgramExercise => ({
            exerciseId: exercise.id,
            position: index + 1,
            targetSets: sets,
            targetRepsMin: 5,
            targetRepsMax: 8,
            restSeconds: 45,
            progression: LINEAR
          })
        );
      if (working.length === 0) {
        throw new Error("No available exercise for a fallback session");
      }

      const first = working[0]!;
      const warmup: ProgramExercise = {
        exerciseId: first.exerciseId,
        position: 0,
        targetSets: 1,
        targetRepsMin: 10,
        targetRepsMax: 10,
        restSeconds: 45,
        isWarmup: true,
        progression: { type: "none" }
      };

      return {
        dayIndex,
        name: plan.name,
        focus: plan.focus,
        exercises: [warmup, ...working]
      } satisfies ProgramSession;
    })
  }));

  const exerciseMeta = new Map(
    catalog.map((exercise) => [
      exercise.id,
      { muscle: exercise.primaryMuscle, secondary: exercise.secondaryMuscles }
    ])
  );
  for (const week of weeks) balanceWeek(week, sessionMinutes, exerciseMeta);

  return {
    splitType,
    durationWeeks,
    daysPerWeek,
    sessionMinutes,
    progressionType: "linear",
    weeks
  };
}

const BALANCE_MUSCLES: MuscleGroup[] = [
  "chest",
  "back",
  "shoulders",
  "quads",
  "hamstrings",
  "glutes"
];

type ExerciseMetaMap = Map<
  string,
  { muscle: MuscleGroup; secondary: MuscleGroup[] }
>;

function balanceWeek(
  week: Program["weeks"][number],
  sessionMinutes: number,
  exerciseMeta: ExerciseMetaMap
) {
  const limitSeconds = sessionMinutes * 60 * 1.15;

  function contributions() {
    const totals = new Map<MuscleGroup, number>(BALANCE_MUSCLES.map((muscle) => [muscle, 0]));
    for (const session of week.sessions) {
      for (const exercise of session.exercises) {
        if (exercise.isWarmup) continue;
        const primary = exercise.targetSets;
        const secondary = exercise.targetSets * 0.5;
        const meta = exerciseMeta.get(exercise.exerciseId);
        if (meta) totals.set(meta.muscle, (totals.get(meta.muscle) ?? 0) + primary);
        for (const area of meta?.secondary ?? []) {
          if (totals.has(area)) totals.set(area, (totals.get(area) ?? 0) + secondary);
        }
      }
    }
    return totals;
  }

  for (let pass = 0; pass < 400; pass += 1) {
    const totals = contributions();
    let changed = false;

    for (const muscle of BALANCE_MUSCLES) {
      const total = totals.get(muscle) ?? 0;
      if (total >= 8 && total <= 22) continue;

      const candidates = week.sessions.flatMap((session) =>
        session.exercises
          .filter((exercise) => !exercise.isWarmup)
          .map((exercise) => {
            const meta = exerciseMeta.get(exercise.exerciseId);
            const weight =
              meta?.muscle === muscle ? 1 : meta?.secondary.includes(muscle) ? 0.5 : 0;
            const working = session.exercises
              .filter((item) => !item.isWarmup)
              .reduce((sum, item) => sum + item.targetSets, 0);
            return { session, exercise, weight, working };
          })
      );

      if (total < 8) {
        const candidate = candidates
          .filter(
            (item) =>
              item.weight > 0 &&
              item.exercise.targetSets < 10 &&
              item.working < 25 &&
              estimatedSeconds(item.session) + estimateSecond(item.exercise) <= limitSeconds
          )
          .sort((a, b) => b.weight - a.weight || a.working - b.working)[0];
        if (candidate) {
          candidate.exercise.targetSets += 1;
          changed = true;
          continue;
        }

        const under = new Set(
          BALANCE_MUSCLES.filter((item) => (totals.get(item) ?? 0) < 8)
        );
        const donors = week.sessions
          .flatMap((session) =>
            session.exercises
              .filter((exercise) => !exercise.isWarmup && exercise.targetSets > 1)
              .map((exercise) => {
                const meta = exerciseMeta.get(exercise.exerciseId);
                const benefit = meta
                  ? (meta.muscle !== undefined && under.has(meta.muscle) ? 1 : 0) +
                    meta.secondary.filter((area) => under.has(area)).length * 0.5
                  : 0;
                const safe = meta
                  ? BALANCE_MUSCLES.every((area) => {
                      const weight =
                        meta.muscle === area
                          ? 1
                          : meta.secondary.includes(area)
                            ? 0.5
                            : 0;
                      return weight === 0 || (totals.get(area) ?? 0) - weight >= 8;
                    })
                  : false;
                return { exercise, benefit, safe: safe && benefit === 0 };
              })
          )
          .filter((item) => item.safe)
          .sort((a, b) => a.benefit - b.benefit);
        const donor = donors[0];
        if (donor) {
          donor.exercise.targetSets -= 1;
          changed = true;
        }
        continue;
      }

      const candidate = candidates
        .filter(
          (item) =>
            item.weight > 0 &&
            item.exercise.targetSets > 1 &&
            total - item.weight >= 8
        )
        .sort((a, b) => b.weight - a.weight)[0];
      if (candidate) {
        candidate.exercise.targetSets -= 1;
        changed = true;
      }
    }

    if (!changed) break;
  }
}

function estimateSecond(exercise: ProgramExercise) {
  const reps = (exercise.targetRepsMin + exercise.targetRepsMax) / 2;
  return reps * 3.5 + exercise.restSeconds;
}

function estimatedSeconds(session: ProgramSession) {
  return session.exercises.reduce(
    (total, exercise) => total + exercise.targetSets * estimateSecond(exercise),
    0
  );
}
