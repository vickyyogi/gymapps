import "server-only";

import { prisma } from "@gymapps/db";
import type { BodyArea, EquipmentType, ExerciseMeta, MuscleGroup } from "@gymapps/domain";
import type { ProgramGenerateInput } from "@/lib/api/phase5-validation";

export const MAX_CONTEXT_TOKENS = 5_000;
const MAX_AVAILABLE_EXERCISES = 80;

export function estimateTokens(value: unknown) {
  return Math.ceil(JSON.stringify(value).length / 4);
}

export function redactPII(value: string, displayName?: string | null) {
  let output = value
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[email]")
    .replace(/\b(?:\+?62|0)8\d{7,12}\b/g, "[phone]")
    .replace(/\bhttps?:\/\/\S+/gi, "[url]")
    .replace(/\b(?:sk|pk|tok)[-_][A-Za-z0-9_-]{8,}\b/g, "[token]")
    .replace(/\b(?:usr|ses|aig|prg)_[A-Za-z0-9]{8,}\b/g, "[id]");

  const name = displayName?.trim();
  if (name && name.length >= 2) {
    output = output.replace(new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "[nama]");
  }
  return output;
}

type ContextArrayKey = "recent_workouts" | "personal_records" | "recent_notes";

export function fitContext<T extends { available_exercises: unknown[]; performance: unknown }>(
  context: T,
  maxTokens = MAX_CONTEXT_TOKENS
): T {
  for (const key of ["recent_workouts", "personal_records", "recent_notes"] as ContextArrayKey[]) {
    const record = context as unknown as Record<string, unknown>;
    while (estimateTokens(context) > maxTokens && Array.isArray(record[key])) {
      const items = record[key] as unknown[];
      if (items.length === 0) break;
      items.pop();
    }
  }

  while (estimateTokens(context) > maxTokens && context.available_exercises.length > 24) {
    context.available_exercises.pop();
  }
  return context;
}

const BODY_AREAS: BodyArea[] = [
  "knee",
  "lower_back",
  "shoulder",
  "elbow",
  "wrist",
  "hip",
  "ankle",
  "neck"
];

function bodyArea(value: string): BodyArea | null {
  return (BODY_AREAS as string[]).includes(value) ? (value as BodyArea) : null;
}

function round(value: number, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export async function buildProgramContext(userId: string, input: ProgramGenerateInput) {
  const now = new Date();
  const since28 = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

  const [user, profile, workouts, records, metrics, notes, volumeSets, activeProgram] =
    await Promise.all([
      prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { displayName: true, locale: true, unitSystem: true }
      }),
      prisma.userProfile.findUnique({ where: { userId } }),
      prisma.workout.findMany({
        where: { userId, status: "finished", deletedAt: null },
        orderBy: { startedAt: "desc" },
        take: 5,
        select: {
          startedAt: true,
          title: true,
          durationSeconds: true,
          totalVolumeKg: true,
          totalSets: true
        }
      }),
      prisma.personalRecord.findMany({
        where: { userId, recordType: "est_1rm" },
        orderBy: { value: "desc" },
        take: 100,
        include: { exercise: { select: { nameId: true } } }
      }),
      prisma.bodyMetric.findMany({
        where: { userId, deletedAt: null },
        orderBy: { recordedOn: "desc" },
        take: 30,
        select: { recordedOn: true, weightKg: true }
      }),
      prisma.note.findMany({
        where: { userId, deletedAt: null, category: "injury" },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { createdAt: true, category: true, body: true }
      }),
      prisma.workoutSet.findMany({
        where: {
          userId,
          isCompleted: true,
          isWarmup: false,
          deletedAt: null,
          createdAt: { gte: since28 },
          workout: { status: "finished", deletedAt: null }
        },
        select: { volumeKg: true, exercise: { select: { primaryMuscle: true } } }
      }),
      prisma.program.findFirst({
        where: { userId, status: "active", deletedAt: null },
        select: {
          id: true,
          name: true,
          durationWeeks: true,
          daysPerWeek: true,
          splitType: true
        }
      })
    ]);

  const requestedEquipment = input.equipment_overrides?.length
    ? input.equipment_overrides
    : profile?.equipment ?? [];
  const availableEquipment = [...new Set<EquipmentType>(["bodyweight", ...requestedEquipment])];

  const injuryAreas = [
    ...new Set<string>([...(profile?.injuryAreas ?? []), ...(input.avoid_areas ?? [])])
  ];
  const injuries = injuryAreas.map(bodyArea).filter((area): area is BodyArea => area !== null);

  const equipmentSet = new Set<string>(availableEquipment);
  const injurySet = new Set(injuryAreas);

  const exerciseRows = await prisma.exercise.findMany({
    where: {
      deletedAt: null,
      status: "published",
      OR: [{ ownerUserId: null }, { ownerUserId: userId }]
    },
    select: {
      id: true,
      nameId: true,
      nameEn: true,
      primaryMuscle: true,
      secondaryMuscles: true,
      equipment: true,
      difficulty: true,
      impactLevel: true,
      contraindicatedAreas: true,
      isCompound: true
    }
  });

  const usable = exerciseRows.filter(
    (exercise) =>
      exercise.equipment.every((item) => equipmentSet.has(item)) &&
      exercise.contraindicatedAreas.every((area) => !injurySet.has(area))
  );

  const fallbackCatalog: ExerciseMeta[] = usable.map((exercise) => ({
    id: exercise.id,
    name: exercise.nameId,
    primaryMuscle: exercise.primaryMuscle as MuscleGroup,
    secondaryMuscles: exercise.secondaryMuscles as MuscleGroup[],
    equipment: exercise.equipment as EquipmentType[],
    kind: exercise.isCompound ? "compound" : "isolation",
    contraindications: exercise.contraindicatedAreas as BodyArea[]
  }));

  const focus = new Set<string>(input.focus_areas ?? []);
  const ranked = [...usable].sort((a, b) => {
    const focusDelta = Number(focus.has(b.primaryMuscle)) - Number(focus.has(a.primaryMuscle));
    if (focusDelta !== 0) return focusDelta;
    const compoundDelta = Number(b.isCompound) - Number(a.isCompound);
    if (compoundDelta !== 0) return compoundDelta;
    return a.id.localeCompare(b.id);
  });

  const availableExercises = ranked.slice(0, MAX_AVAILABLE_EXERCISES).map((exercise) => ({
    id: exercise.id,
    name: exercise.nameId,
    primary_muscle: exercise.primaryMuscle,
    secondary_muscles: exercise.secondaryMuscles,
    equipment: exercise.equipment,
    difficulty: exercise.difficulty,
    impact_level: exercise.impactLevel,
    is_compound: exercise.isCompound
  }));

  const volumeByMuscle = new Map<string, number>();
  for (const set of volumeSets) {
    const muscle = set.exercise.primaryMuscle;
    volumeByMuscle.set(muscle, (volumeByMuscle.get(muscle) ?? 0) + Number(set.volumeKg));
  }

  const oneRm = new Map<string, number>();
  for (const record of records) {
    if (!oneRm.has(record.exercise.nameId)) oneRm.set(record.exercise.nameId, Number(record.value));
  }

  const latestWeight = metrics.find((item) => item.weightKg !== null);
  const oldestWeight = [...metrics].reverse().find((item) => item.weightKg !== null);

  let adherence: number | null = null;
  if (activeProgram) {
    const completed = await prisma.programSession.count({
      where: {
        programId: activeProgram.id,
        completedAt: { gte: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000) }
      }
    });
    adherence = Math.min(1, completed / Math.max(1, activeProgram.daysPerWeek * 4));
  }

  const context = {
    profile: {
      goals: profile?.goals ?? [],
      experience_level: profile?.experienceLevel ?? null,
      days_per_week: profile?.daysPerWeek ?? null,
      session_minutes: profile?.sessionMinutes ?? null,
      equipment: profile?.equipment ?? [],
      injury_areas: injuryAreas,
      injury_notes: redactPII(profile?.injuryNotes ?? "", user.displayName),
      unit_system: user.unitSystem,
      language: user.locale,
      style_notes: redactPII(profile?.programStyleNotes ?? "", user.displayName)
    },
    active_program: activeProgram
      ? {
          name: redactPII(activeProgram.name, user.displayName),
          split_type: activeProgram.splitType,
          duration_weeks: activeProgram.durationWeeks,
          days_per_week: activeProgram.daysPerWeek
        }
      : null,
    request: {
      goal: input.goal,
      split_type: input.split_type,
      duration_weeks: input.duration_weeks,
      days_per_week: input.days_per_week,
      session_minutes: input.session_minutes ?? profile?.sessionMinutes ?? 60,
      equipment_overrides: input.equipment_overrides ?? [],
      focus_areas: input.focus_areas ?? [],
      avoid_areas: injuryAreas,
      notes: redactPII(input.notes ?? "", user.displayName)
    },
    available_exercises: availableExercises,
    performance: {
      recent_volume_by_muscle: Object.fromEntries(
        [...volumeByMuscle.entries()].map(([muscle, volume]) => [muscle, round(volume)])
      ),
      estimated_1rm: Object.fromEntries([...oneRm.entries()].slice(0, 10)),
      adherence
    },
    recent_workouts: workouts.map((workout) => ({
      date: workout.startedAt.toISOString().slice(0, 10),
      title: redactPII(workout.title ?? "", user.displayName),
      duration_min: workout.durationSeconds ? Math.round(workout.durationSeconds / 60) : null,
      volume_kg: round(Number(workout.totalVolumeKg)),
      sets: workout.totalSets
    })),
    personal_records: [...oneRm.entries()].slice(0, 10).map(([exercise, value]) => ({
      exercise,
      type: "est_1rm",
      value: round(value)
    })),
    body_metrics: latestWeight
      ? {
          latest: {
            date: latestWeight.recordedOn.toISOString().slice(0, 10),
            weight_kg: Number(latestWeight.weightKg)
          },
          trend_4w_kg:
            oldestWeight && oldestWeight !== latestWeight && oldestWeight.weightKg !== null
              ? round(Number(latestWeight.weightKg) - Number(oldestWeight.weightKg))
              : null
        }
      : null,
    recent_notes: notes.map((note) => ({
      date: note.createdAt.toISOString().slice(0, 10),
      category: note.category,
      body: redactPII(note.body, user.displayName)
    }))
  };

  const aiContext = fitContext(context);
  const catalog = fallbackCatalog.filter((exercise) =>
    availableExercises.some((item) => item.id === exercise.id)
  );

  return {
    context: aiContext,
    catalog,
    fallbackCatalog,
    availableEquipment,
    injuries,
    inputHash: hashContext(aiContext, userId)
  };
}

function hashContext(context: unknown, userId: string) {
  // Lazy dependency-free hash is enough for audit/dedup keys.
  const text = `${userId}:${JSON.stringify(context)}`;
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
