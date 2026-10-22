import type { BodyArea, EquipmentType, ExerciseMeta, MuscleGroup } from "../types";
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
  "chest",
  "back",
  "shoulders"
];

const LINEAR: Progression = { type: "linear", incrementKg: 2.5 };

function scheduleFor(splitType: SplitType, days: number): number[] {
  if (splitType === "push_pull_legs") {
    if (days !== 3) throw new Error("push_pull_legs requires exactly 3 days");
    return [1, 3, 5];
  }
  if (days === 1) return [1];
  if (days === 2) return [1, 4];
  if (days === 3) return [1, 3, 5];
  if (days === 4) return [1, 2, 4, 5];
  throw new Error("fallback generator supports 1-4 days per week");
}

function plansFor(splitType: SplitType, days: number): DayPlan[] {
  if (splitType === "upper_lower") {
    return Array.from({ length: days }, (_, index) =>
      index % 2 === 0
        ? {
            name: `Upper ${Math.floor(index / 2) + 1}`,
            focus: "upper",
            muscles: ["chest", "chest", "back", "back", "shoulders"]
          }
        : {
            name: `Lower ${Math.floor(index / 2) + 1}`,
            focus: "lower",
            muscles: ["quads", "quads", "hamstrings", "hamstrings"]
          }
    );
  }

  if (splitType === "push_pull_legs") {
    return [
      { name: "Push", focus: "push", muscles: ["chest", "chest", "shoulders"] },
      { name: "Pull", focus: "pull", muscles: ["back", "back", "back", "back"] },
      {
        name: "Legs",
        focus: "legs",
        muscles: ["quads", "quads", "hamstrings", "hamstrings"]
      }
    ];
  }

  // full_body, bro_split and custom use the same full-body movement pattern.
  return Array.from({ length: days }, (_, index) => ({
    name: days === 1 ? "Full Body" : `Full Body ${index + 1}`,
    focus: days === 4 ? (index % 2 === 0 ? "full_body_a" : "full_body_b") : "full_body",
    muscles: FULL_BODY_MUSCLES
  }));
}

function setsFor(splitType: SplitType, days: number) {
  if (splitType === "upper_lower" || splitType === "push_pull_legs") return 4;
  if (days <= 2) return 4;
  if (days === 3) return 3;
  return 2;
}

export function generateFallbackProgram(input: GenerateProgramInput): Program {
  const { splitType, daysPerWeek, durationWeeks, sessionMinutes, catalog } = input;
  if (!Number.isInteger(durationWeeks) || durationWeeks < 1 || durationWeeks > 52) {
    throw new Error("durationWeeks must be 1-52");
  }
  if (!Number.isInteger(daysPerWeek) || daysPerWeek < 1 || daysPerWeek > 4) {
    throw new Error("fallback generator supports 1-4 days per week");
  }
  if (splitType === "full_body" && daysPerWeek < 2) {
    throw new Error("full_body requires 2-4 days");
  }
  if (splitType === "upper_lower" && daysPerWeek < 2) {
    throw new Error("upper_lower requires 2-4 days");
  }
  if (splitType === "push_pull_legs" && daysPerWeek !== 3) {
    throw new Error("push_pull_legs requires exactly 3 days");
  }
  if (splitType === "bro_split" && daysPerWeek < 3) {
    throw new Error("bro_split requires 3-7 days");
  }
  if (splitType === "custom" && daysPerWeek < 3) {
    throw new Error("custom fallback requires 3-4 days to reach weekly volume");
  }

  const schedule = scheduleFor(splitType, daysPerWeek);
  const plans = plansFor(splitType, daysPerWeek);
  const available = new Set<string>(["bodyweight", ...input.availableEquipment]);
  const injuries = new Set(input.injuries ?? []);
  const sets = setsFor(splitType, daysPerWeek);
  const sortedCatalog = [...catalog].sort((a, b) => a.id.localeCompare(b.id));

  function pick(muscle: MuscleGroup, used: Set<string>): ExerciseMeta {
    const found = sortedCatalog.find(
      (exercise) =>
        exercise.primaryMuscle === muscle &&
        !used.has(exercise.id) &&
        exercise.equipment.every((item) => available.has(item)) &&
        exercise.contraindications.every((area) => !injuries.has(area))
    );
    if (!found) {
      throw new Error(`No available ${muscle} exercise for the fallback program`);
    }
    used.add(found.id);
    return found;
  }

  const weeks = Array.from({ length: durationWeeks }, (_, weekIndex) => ({
    weekNumber: weekIndex + 1,
    isDeload: false,
    volumeMultiplier: 1,
    sessions: schedule.map((dayIndex, sessionIndex) => {
      const plan = plans[sessionIndex]!;
      const used = new Set<string>();
      const working: ProgramExercise[] = plan.muscles.map((muscle, index) => ({
        exerciseId: pick(muscle, used).id,
        position: index + 1,
        targetSets: sets,
        targetRepsMin: 5,
        targetRepsMax: 8,
        restSeconds: 45,
        progression: LINEAR
      }));

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

  return {
    splitType,
    durationWeeks,
    daysPerWeek,
    sessionMinutes,
    progressionType: "linear",
    weeks
  };
}
