import { NextResponse } from "next/server";
import { prisma } from "@gymapps/db";
import { withAuthApi, parseJson, clientIp } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { updateWorkoutSchema } from "@/lib/api/phase3-validation";
import { expireAbandonedWorkouts, getOwnedWorkout, previousPerformances } from "@/lib/api/resources";
import {
  serializeWorkoutDetail,
  workoutDetailInclude
} from "@/lib/api/serializers";
import { writeAudit } from "@/lib/audit";

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
  const current = await getOwnedWorkout(workoutId, session.user.id);
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

  await writeAudit({
    userId: session.user.id,
    action: "workout.updated",
    entityType: "workout",
    entityId: workoutId,
    before: {
      title: current.title ?? undefined,
      bodyweight_kg: current.bodyweightKg ? Number(current.bodyweightKg) : undefined
    },
    after: input,
    ipAddress: clientIp(request)
  });

  return NextResponse.json({
    data: serializeWorkoutDetail(updated, await previousPerformances(session.user.id, updated))
  });
});

export const DELETE = withAuthApi(async ({ request, params, session }) => {
  const workoutId = String(params.workoutId);
  await getOwnedWorkout(workoutId, session.user.id);
  await prisma.workout.update({
    where: { id: workoutId },
    data: { deletedAt: new Date() }
  });

  await writeAudit({
    userId: session.user.id,
    action: "workout.deleted",
    entityType: "workout",
    entityId: workoutId,
    after: { deleted: true },
    ipAddress: clientIp(request)
  });

  return new NextResponse(null, { status: 204 });
});
