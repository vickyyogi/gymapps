import { NextResponse } from "next/server";
import { prisma } from "@gymapps/db";
import { withAuthApi, parseJson } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { updateWorkoutSchema } from "@/lib/api/phase3-validation";
import { expireAbandonedWorkouts, getOwnedWorkout, previousPerformances } from "@/lib/api/resources";
import {
  serializeWorkoutDetail,
  workoutDetailInclude
} from "@/lib/api/serializers";

export const runtime = "nodejs";

async function detail(workoutId: string) {
  return prisma.workout.findUniqueOrThrow({
    where: { id: workoutId },
    include: workoutDetailInclude
  });
}

export const GET = withAuthApi(async ({ params, session }) => {
  const workoutId = String(params.workoutId);
  await expireAbandonedWorkouts(session.user.id);
  const workout = await prisma.workout.findFirst({
    where: { id: workoutId, deletedAt: null },
    include: workoutDetailInclude
  });
  if (!workout) throw new ApiError(404, "NOT_FOUND", "Workout not found");
  if (workout.userId !== session.user.id) {
    throw new ApiError(403, "FORBIDDEN", "Workout belongs to another user");
  }
  return NextResponse.json({
    data: serializeWorkoutDetail(workout, await previousPerformances(session.user.id, workout))
  });
});

export const PATCH = withAuthApi(async ({ request, params, session }) => {
  const workoutId = String(params.workoutId);
  await getOwnedWorkout(workoutId, session.user.id);
  const input = await parseJson(request, updateWorkoutSchema);

  await prisma.workout.update({
    where: { id: workoutId },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      ...(input.bodyweight_kg !== undefined ? { bodyweightKg: input.bodyweight_kg } : {}),
      ...(input.session_rpe !== undefined ? { sessionRpe: input.session_rpe } : {})
    }
  });

  const updated = await detail(workoutId);
  return NextResponse.json({
    data: serializeWorkoutDetail(updated, await previousPerformances(session.user.id, updated))
  });
});

export const DELETE = withAuthApi(async ({ params, session }) => {
  const workoutId = String(params.workoutId);
  await getOwnedWorkout(workoutId, session.user.id);
  await prisma.workout.update({
    where: { id: workoutId },
    data: { deletedAt: new Date() }
  });
  return new NextResponse(null, { status: 204 });
});
