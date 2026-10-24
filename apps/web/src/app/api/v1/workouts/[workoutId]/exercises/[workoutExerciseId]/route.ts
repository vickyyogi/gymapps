import { NextResponse } from "next/server";
import { prisma } from "@gymapps/db";
import { withAuthApi } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { getOwnedWorkout, recalculateWorkoutTotals } from "@/lib/api/resources";

export const runtime = "nodejs";

export const DELETE = withAuthApi(async ({ params, session }) => {
  const workoutId = String(params.workoutId);
  const workoutExerciseId = String(params.workoutExerciseId);
  const workout = await getOwnedWorkout(workoutId, session.user.id);
  if (workout.status !== "active") {
    throw new ApiError(409, "WORKOUT_NOT_ACTIVE", "Workout is not active");
  }

  const existing = await prisma.workoutExercise.findFirst({
    where: { id: workoutExerciseId, workoutId },
    select: { id: true }
  });
  if (!existing) {
    throw new ApiError(404, "NOT_FOUND", "Workout exercise not found");
  }

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.workoutSet.updateMany({
      where: { workoutExerciseId, workoutId, userId: session.user.id, deletedAt: null },
      data: { deletedAt: now }
    });
    await tx.workoutExercise.delete({
      where: { id: workoutExerciseId }
    });
    await recalculateWorkoutTotals(workoutId, tx);
  });

  return new NextResponse(null, { status: 204 });
});
