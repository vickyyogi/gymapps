import "server-only";

import { prisma, Prisma, type Workout } from "@gymapps/db";
import type { BestRecords } from "@gymapps/domain";
import { ApiError } from "@/lib/api/errors";

export const ABANDONED_AFTER_MS = 24 * 60 * 60 * 1000;

export async function expireAbandonedWorkouts(userId: string) {
  const cutoff = new Date(Date.now() - ABANDONED_AFTER_MS);
  const rows = await prisma.workout.findMany({
    where: { userId, status: "active", startedAt: { lt: cutoff }, deletedAt: null },
    select: { id: true }
  });
  if (rows.length === 0) return;

  await prisma.workout.updateMany({
    where: { id: { in: rows.map((row) => row.id) } },
    data: {
      status: "abandoned",
      endedAt: new Date(),
      durationSeconds: Math.floor(ABANDONED_AFTER_MS / 1000)
    }
  });
}

export async function getOwnedWorkout(workoutId: string, userId: string): Promise<Workout> {
  await expireAbandonedWorkouts(userId);
  const workout = await prisma.workout.findFirst({
    where: { id: workoutId, deletedAt: null }
  });
  if (!workout) throw new ApiError(404, "NOT_FOUND", "Workout not found");
  if (workout.userId !== userId) {
    throw new ApiError(403, "FORBIDDEN", "Workout belongs to another user");
  }
  return workout;
}

export async function getOwnedProgram(programId: string, userId: string) {
  const program = await prisma.program.findFirst({
    where: { id: programId, deletedAt: null }
  });
  if (!program) throw new ApiError(404, "NOT_FOUND", "Program not found");
  if (program.userId !== userId) {
    throw new ApiError(403, "FORBIDDEN", "Program belongs to another user");
  }
  return program;
}

export async function getVisibleExercise(exerciseId: string, userId: string) {
  const exercise = await prisma.exercise.findFirst({
    where: {
      id: exerciseId,
      deletedAt: null,
      status: "published",
      OR: [{ ownerUserId: null }, { ownerUserId: userId }]
    }
  });
  if (exercise) return exercise;

  const existing = await prisma.exercise.findUnique({ where: { id: exerciseId } });
  if (existing && existing.ownerUserId && existing.ownerUserId !== userId) {
    throw new ApiError(403, "FORBIDDEN", "Exercise belongs to another user");
  }
  throw new ApiError(404, "NOT_FOUND", "Exercise not found");
}

export async function previousPerformances(
  userId: string,
  workout: { id: string; startedAt: Date; exercises: Array<{ exerciseId: string }> }
) {
  const map = new Map<
    string,
    { date: string; sets: Array<{ set_number: number; weight_kg: number; reps: number }> }
  >();

  await Promise.all(
    [...new Set(workout.exercises.map((item) => item.exerciseId))].map(async (exerciseId) => {
      const previous = await prisma.workoutExercise.findFirst({
        where: {
          exerciseId,
          workout: {
            userId,
            status: "finished",
            deletedAt: null,
            id: { not: workout.id },
            startedAt: { lt: workout.startedAt }
          },
          sets: { some: { isCompleted: true, deletedAt: null } }
        },
        orderBy: { workout: { startedAt: "desc" } },
        include: {
          workout: { select: { startedAt: true } },
          sets: {
            where: { isCompleted: true, deletedAt: null },
            orderBy: { setNumber: "asc" },
            select: { setNumber: true, weightKg: true, reps: true }
          }
        }
      });
      if (!previous) return;
      map.set(exerciseId, {
        date: previous.workout.startedAt.toISOString(),
        sets: previous.sets.map((set) => ({
          set_number: set.setNumber,
          weight_kg: Number(set.weightKg),
          reps: set.reps
        }))
      });
    })
  );

  return map;
}

export async function recalculateWorkoutTotals(
  workoutId: string,
  client: Prisma.TransactionClient | typeof prisma = prisma
) {
  const aggregate = await client.workoutSet.aggregate({
    where: {
      workoutId,
      deletedAt: null,
      isCompleted: true,
      isWarmup: false
    },
    _sum: { volumeKg: true, reps: true },
    _count: { id: true }
  });

  return client.workout.update({
    where: { id: workoutId },
    data: {
      totalVolumeKg: Number(aggregate._sum.volumeKg ?? 0),
      totalSets: aggregate._count.id,
      totalReps: aggregate._sum.reps ?? 0
    }
  });
}

export async function currentBests(
  userId: string,
  exerciseId: string,
  client: Prisma.TransactionClient | typeof prisma = prisma
): Promise<BestRecords> {
  const rows = await client.personalRecord.findMany({
    where: { userId, exerciseId },
    orderBy: { achievedAt: "desc" }
  });

  const bests: BestRecords = {};
  for (const row of rows) {
    const type = row.recordType as keyof BestRecords;
    if (bests[type] === undefined) bests[type] = Number(row.value);
  }
  return bests;
}

export function isUniqueViolation(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 90);
}

export async function programCompletionPct(programId: string) {
  const [total, completed] = await Promise.all([
    prisma.programSession.count({ where: { programId } }),
    prisma.programSession.count({ where: { programId, completedAt: { not: null } } })
  ]);
  return total ? (completed / total) * 100 : 0;
}
