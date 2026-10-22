import { NextResponse } from "next/server";
import { prisma } from "@gymapps/db";
import { withAuthApi, parseJson } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { addWorkoutExerciseSchema } from "@/lib/api/phase3-validation";
import {
  getOwnedWorkout,
  getVisibleExercise,
  isUniqueViolation
} from "@/lib/api/resources";
import { serializeWorkoutExercise } from "@/lib/api/serializers";
import { newId } from "@/lib/id";

export const runtime = "nodejs";

export const POST = withAuthApi(async ({ request, params, session }) => {
  const workoutId = String(params.workoutId);
  const workout = await getOwnedWorkout(workoutId, session.user.id);
  if (workout.status !== "active") {
    throw new ApiError(409, "WORKOUT_NOT_ACTIVE", "Workout is not active");
  }

  const input = await parseJson(request, addWorkoutExerciseSchema);
  await getVisibleExercise(input.exercise_id, session.user.id);

  const position =
    ((await prisma.workoutExercise.aggregate({
      where: { workoutId },
      _max: { position: true }
    }))._max.position ?? 0) + 1;

  try {
    const created = await prisma.workoutExercise.create({
      data: {
        id: newId("wex"),
        workoutId,
        exerciseId: input.exercise_id,
        position,
        notes: input.notes ?? null,
        supersetGroup: input.superset_group ?? null
      },
      include: { exercise: true }
    });
    return NextResponse.json(
      { data: serializeWorkoutExercise({ ...created, sets: [] }) },
      { status: 201 }
    );
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ApiError(409, "POSITION_TAKEN", "Another exercise already uses that position");
    }
    throw error;
  }
});
