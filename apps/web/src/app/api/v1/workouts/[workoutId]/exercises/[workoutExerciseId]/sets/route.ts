import { NextResponse } from "next/server";
import { prisma } from "@gymapps/db";
import { detectPersonalRecords, estimateOneRm, setVolume } from "@gymapps/domain";
import { withAuthApi, parseJson } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import {
  idempotencyKeyFrom,
  savedIdempotentResponse,
  saveIdempotentResponse
} from "@/lib/api/idempotency";
import { workoutSetSchema } from "@/lib/api/phase3-validation";
import {
  currentBests,
  getOwnedWorkout,
  isUniqueViolation,
  recalculateWorkoutTotals
} from "@/lib/api/resources";
import { serializeWorkoutSet } from "@/lib/api/serializers";
import { newId } from "@/lib/id";

export const runtime = "nodejs";

export const POST = withAuthApi(async ({ request, params, session }) => {
  const workoutId = String(params.workoutId);
  const workoutExerciseId = String(params.workoutExerciseId);
  const key = idempotencyKeyFrom(request);
  const method = request.method;
  const path = request.nextUrl.pathname;

  if (key) {
    const saved = await savedIdempotentResponse(session.user.id, key, method, path);
    if (saved) return saved;
  }

  const workout = await getOwnedWorkout(workoutId, session.user.id);
  if (workout.status !== "active") {
    throw new ApiError(409, "WORKOUT_NOT_ACTIVE", "Workout is not active");
  }

  const workoutExercise = await prisma.workoutExercise.findFirst({
    where: { id: workoutExerciseId, workoutId }
  });
  if (!workoutExercise) {
    throw new ApiError(404, "NOT_FOUND", "Workout exercise not found");
  }

  const input = await parseJson(request, workoutSetSchema);

  try {
    const body = await prisma.$transaction(async (tx) => {
      const max = await tx.workoutSet.findFirst({
        where: { workoutExerciseId },
        orderBy: { setNumber: "desc" },
        select: { setNumber: true }
      });
      const setNumber = (max?.setNumber ?? 0) + 1;
      const volumeKg = setVolume(input.weight_kg, input.reps);
      const estimated = estimateOneRm(input.weight_kg, input.reps);
      const bests = await currentBests(session.user.id, workoutExercise.exerciseId, tx);
      const records =
        input.is_warmup || !input.is_completed
          ? []
          : detectPersonalRecords({ weightKg: input.weight_kg, reps: input.reps }, bests);

      const now = new Date();
      const created = await tx.workoutSet.create({
        data: {
          id: newId("wst"),
          workoutExerciseId,
          workoutId,
          userId: session.user.id,
          exerciseId: workoutExercise.exerciseId,
          setNumber,
          weightKg: input.weight_kg,
          reps: input.reps,
          rpe: input.rpe ?? null,
          isWarmup: input.is_warmup,
          isCompleted: input.is_completed,
          isPr: records.length > 0,
          est1rmKg: estimated,
          volumeKg,
          durationSeconds: input.duration_seconds ?? null,
          distanceKm: input.distance_km ?? null,
          avgHeartRate: input.avg_heart_rate ?? null,
          calories: input.calories ?? null,
          createdAt: now
        }
      });

      if (records.length > 0) {
        await tx.personalRecord.createMany({
          data: records.map((record) => ({
            id: newId("pr"),
            userId: session.user.id,
            exerciseId: workoutExercise.exerciseId,
            recordType: record.type,
            value: record.value,
            reps: record.reps,
            weightKg: record.weightKg,
            achievedAt: now,
            workoutSetId: created.id
          }))
        });
      }

      const totals = await recalculateWorkoutTotals(workoutId, tx);
      const payload = {
        data: serializeWorkoutSet(created),
        meta: {
          workout_total_volume_kg: Number(totals.totalVolumeKg),
          prs_created: records.length
        }
      };

      if (key) {
        await saveIdempotentResponse(tx, {
          userId: session.user.id,
          key,
          method,
          path,
          statusCode: 201,
          response: payload
        });
      }

      return payload;
    });

    return NextResponse.json(body, { status: 201 });
  } catch (error) {
    if (key && isUniqueViolation(error)) {
      const saved = await savedIdempotentResponse(session.user.id, key, method, path);
      if (saved) return saved;
    }
    throw error;
  }
});
