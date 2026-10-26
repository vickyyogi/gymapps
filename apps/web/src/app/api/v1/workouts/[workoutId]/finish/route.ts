import { NextResponse } from "next/server";
import { prisma } from "@gymapps/db";
import { withAuthApi, clientIp } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { getOwnedWorkout, recalculateWorkoutTotals } from "@/lib/api/resources";
import {
  serializeWorkoutDetail,
  workoutDetailInclude
} from "@/lib/api/serializers";
import { evaluateRecommendationsForUser } from "@/lib/ai/recommendations";
import { track } from "@/lib/analytics";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";

export const POST = withAuthApi(async ({ request, params, session }) => {
  const workoutId = String(params.workoutId);
  const workout = await getOwnedWorkout(workoutId, session.user.id);
  if (workout.status === "abandoned") {
    throw new ApiError(409, "WORKOUT_ABANDONED", "Workout was abandoned");
  }
  const wasActive = workout.status === "active";

  if (workout.status === "active") {
    await prisma.$transaction(async (tx) => {
      const endedAt = new Date();
      const durationSeconds = Math.max(
        0,
        Math.floor((endedAt.getTime() - workout.startedAt.getTime()) / 1000)
      );
      await tx.workout.update({
        where: { id: workoutId },
        data: { status: "finished", endedAt, durationSeconds }
      });
      await recalculateWorkoutTotals(workoutId, tx);

      if (workout.programSessionId) {
        await tx.programSession.updateMany({
          where: { id: workout.programSessionId, completedAt: null },
          data: { completedAt: endedAt }
        });
      }
    });
  }

  if (workout.programId && workout.programSessionId) {
    const [total, completed] = await Promise.all([
      prisma.programSession.count({ where: { programId: workout.programId } }),
      prisma.programSession.count({
        where: { programId: workout.programId, completedAt: { not: null } }
      })
    ]);
    if (total > 0 && completed >= total) {
      await prisma.program.updateMany({
        where: { id: workout.programId, status: "active" },
        data: { status: "completed", completedAt: new Date() }
      });
    }
  }

  const detail = await prisma.workout.findUniqueOrThrow({
    where: { id: workoutId },
    include: workoutDetailInclude
  });
  const prsCreated = await prisma.personalRecord.count({
    where: { workoutSet: { is: { workoutId } } }
  });
  const recommendations = wasActive
    ? await evaluateRecommendationsForUser({
        userId: session.user.id,
        triggerWorkoutId: workoutId
      })
    : [];

  if (wasActive) {
    track("workout_completed", session.user.id, {
      total_sets: detail.totalSets,
      total_volume_kg: Number(detail.totalVolumeKg),
      duration_seconds: detail.durationSeconds,
      prs_created: prsCreated
    });
    await writeAudit({
      userId: session.user.id,
      action: "workout.finished",
      entityType: "workout",
      entityId: workoutId,
      after: { total_volume_kg: Number(detail.totalVolumeKg), total_sets: detail.totalSets },
      ipAddress: clientIp(request)
    });
  }

  return NextResponse.json({
    data: serializeWorkoutDetail(detail),
    meta: { prs_created: prsCreated, recommendations_created: recommendations.length }
  });
});
