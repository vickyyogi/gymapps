import { NextResponse } from "next/server";
import { prisma, Prisma } from "@gymapps/db";
import { withAuthApi, parseJson } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { updateExerciseSchema } from "@/lib/api/phase3-validation";
import { serializeExercise, serializeExerciseDetail } from "@/lib/api/serializers";

export const runtime = "nodejs";

async function findVisibleExercise(exerciseId: string, userId: string) {
  const exercise = await prisma.exercise.findFirst({
    where: {
      id: exerciseId,
      deletedAt: null,
      OR: [{ ownerUserId: null }, { ownerUserId: userId }]
    }
  });
  if (exercise) return exercise;

  const existing = await prisma.exercise.findUnique({ where: { id: exerciseId } });
  if (existing && !existing.deletedAt) {
    throw new ApiError(403, "FORBIDDEN", "Exercise belongs to another user");
  }
  throw new ApiError(404, "NOT_FOUND", "Exercise not found");
}

export const GET = withAuthApi(async ({ params, session }) => {
  const exerciseId = String(params.exerciseId);
  const exercise = await findVisibleExercise(exerciseId, session.user.id);

  const baseWhere = {
    userId: session.user.id,
    exerciseId,
    deletedAt: null,
    isCompleted: true
  } as const;
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [lastSet, sessions, best, volume] = await Promise.all([
    prisma.workoutSet.findFirst({
      where: baseWhere,
      orderBy: { createdAt: "desc" },
      select: { createdAt: true }
    }),
    prisma.workoutSet.findMany({
      where: baseWhere,
      distinct: ["workoutId"],
      select: { workoutId: true }
    }),
    prisma.workoutSet.findFirst({
      where: { ...baseWhere, OR: [{ est1rmKg: { not: null } }, { weightKg: { gt: 0 } }] },
      orderBy: [{ est1rmKg: "desc" }, { weightKg: "desc" }]
    }),
    prisma.workoutSet.aggregate({
      where: { ...baseWhere, isWarmup: false, createdAt: { gte: since } },
      _sum: { volumeKg: true }
    })
  ]);

  return NextResponse.json({
    data: serializeExerciseDetail(exercise, {
      last_performed_at: lastSet?.createdAt ?? null,
      session_count: sessions.length,
      best_set: best ? `${Number(best.weightKg)} kg × ${best.reps}` : null,
      best_est_1rm_kg: best?.est1rmKg === null || best?.est1rmKg === undefined
        ? null
        : Number(best.est1rmKg),
      volume_30d_kg: Number(volume._sum.volumeKg ?? 0)
    })
  });
});

export const PATCH = withAuthApi(async ({ request, params, session }) => {
  const exerciseId = String(params.exerciseId);
  const exercise = await prisma.exercise.findFirst({
    where: { id: exerciseId, deletedAt: null }
  });
  if (!exercise) throw new ApiError(404, "NOT_FOUND", "Exercise not found");

  const isAdmin = session.user.role === "admin";
  if (exercise.ownerUserId !== session.user.id && !(exercise.ownerUserId === null && isAdmin)) {
    throw new ApiError(403, "FORBIDDEN", "Only the owner or an admin can edit this exercise");
  }

  const input = await parseJson(request, updateExerciseSchema);
  const data: Prisma.ExerciseUpdateInput = {};
  if (input.name_id !== undefined) data.nameId = input.name_id;
  if (input.name_en !== undefined) data.nameEn = input.name_en;
  if (input.description_id !== undefined) data.descriptionId = input.description_id;
  if (input.instructions_id !== undefined) data.instructionsId = input.instructions_id;
  if (input.instructions_en !== undefined) data.instructionsEn = input.instructions_en;
  if (input.primary_muscle !== undefined) data.primaryMuscle = input.primary_muscle;
  if (input.secondary_muscles !== undefined) data.secondaryMuscles = input.secondary_muscles;
  if (input.equipment !== undefined) data.equipment = input.equipment;
  if (input.difficulty !== undefined) data.difficulty = input.difficulty;
  if (input.status !== undefined) data.status = input.status;

  const updated = await prisma.exercise.update({ where: { id: exerciseId }, data });
  return NextResponse.json({ data: serializeExercise(updated) });
});

export const DELETE = withAuthApi(async ({ params, session }) => {
  const exerciseId = String(params.exerciseId);
  const exercise = await prisma.exercise.findFirst({
    where: { id: exerciseId, deletedAt: null }
  });
  if (!exercise) throw new ApiError(404, "NOT_FOUND", "Exercise not found");
  if (exercise.source !== "custom" || exercise.ownerUserId !== session.user.id) {
    throw new ApiError(403, "FORBIDDEN", "Only your own custom exercise can be deleted");
  }

  const [programUses, workoutUses] = await Promise.all([
    prisma.programExercise.count({ where: { exerciseId } }),
    prisma.workoutExercise.count({ where: { exerciseId } })
  ]);
  if (programUses + workoutUses > 0) {
    throw new ApiError(409, "EXERCISE_IN_USE", "Exercise is used by a program or workout");
  }

  await prisma.exercise.update({
    where: { id: exerciseId },
    data: { status: "archived", deletedAt: new Date() }
  });
  return new NextResponse(null, { status: 204 });
});
