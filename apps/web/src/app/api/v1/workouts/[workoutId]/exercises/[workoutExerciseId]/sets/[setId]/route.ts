import { NextResponse } from "next/server";
import { prisma } from "@gymapps/db";
import { estimateOneRm, setVolume } from "@gymapps/domain";
import { withAuthApi, parseJson } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { updateSetSchema } from "@/lib/api/phase3-validation";
import { getOwnedWorkout, recalculateWorkoutTotals } from "@/lib/api/resources";
import { serializeWorkoutSet } from "@/lib/api/serializers";

export const runtime = "nodejs";

export const PATCH = withAuthApi(async ({ request, params, session }) => {
  const workoutId = String(params.workoutId);
  const workoutExerciseId = String(params.workoutExerciseId);
  const setId = String(params.setId);
  const workout = await getOwnedWorkout(workoutId, session.user.id);
  if (workout.status !== "active") {
    throw new ApiError(409, "WORKOUT_NOT_ACTIVE", "Workout is not active");
  }

  const existing = await prisma.workoutSet.findFirst({
    where: {
      id: setId,
      workoutExerciseId,
      workoutId,
      userId: session.user.id,
      deletedAt: null
    }
  });
  if (!existing) throw new ApiError(404, "NOT_FOUND", "Set not found");

  const input = await parseJson(request, updateSetSchema);
  const weightKg = input.weight_kg ?? Number(existing.weightKg);
  const reps = input.reps ?? existing.reps;

  const updated = await prisma.$transaction(async (tx) => {
    const set = await tx.workoutSet.update({
      where: { id: setId },
      data: {
        weightKg,
        reps,
        volumeKg: setVolume(weightKg, reps),
        est1rmKg: estimateOneRm(weightKg, reps),
        ...(input.rpe !== undefined ? { rpe: input.rpe } : {}),
        ...(input.is_warmup !== undefined ? { isWarmup: input.is_warmup } : {}),
        ...(input.is_completed !== undefined ? { isCompleted: input.is_completed } : {})
      }
    });
    await recalculateWorkoutTotals(workoutId, tx);
    return set;
  });

  return NextResponse.json({ data: serializeWorkoutSet(updated) });
});

export const DELETE = withAuthApi(async ({ params, session }) => {
  const workoutId = String(params.workoutId);
  const workoutExerciseId = String(params.workoutExerciseId);
  const setId = String(params.setId);
  const workout = await getOwnedWorkout(workoutId, session.user.id);
  if (workout.status !== "active") {
    throw new ApiError(409, "WORKOUT_NOT_ACTIVE", "Workout is not active");
  }

  const existing = await prisma.workoutSet.findFirst({
    where: {
      id: setId,
      workoutExerciseId,
      workoutId,
      userId: session.user.id,
      deletedAt: null
    },
    select: { id: true }
  });
  if (!existing) throw new ApiError(404, "NOT_FOUND", "Set not found");

  await prisma.$transaction(async (tx) => {
    await tx.workoutSet.update({ where: { id: setId }, data: { deletedAt: new Date() } });
    await recalculateWorkoutTotals(workoutId, tx);
  });

  return new NextResponse(null, { status: 204 });
});
