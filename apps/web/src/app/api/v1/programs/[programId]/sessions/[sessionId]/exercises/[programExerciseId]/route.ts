import { NextResponse } from "next/server";
import { prisma, Prisma } from "@gymapps/db";
import { withAuthApi, parseJson } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { updateProgramExerciseSchema } from "@/lib/api/phase3-validation";
import {
  getOwnedProgram,
  getVisibleExercise,
  isUniqueViolation
} from "@/lib/api/resources";
import { serializeProgramExercise } from "@/lib/api/serializers";

export const runtime = "nodejs";

export const PATCH = withAuthApi(async ({ request, params, session }) => {
  const programId = String(params.programId);
  const sessionId = String(params.sessionId);
  const programExerciseId = String(params.programExerciseId);
  await getOwnedProgram(programId, session.user.id);

  const existing = await prisma.programExercise.findFirst({
    where: {
      id: programExerciseId,
      programSessionId: sessionId,
      session: { programId }
    }
  });
  if (!existing) throw new ApiError(404, "NOT_FOUND", "Program exercise not found");

  const input = await parseJson(request, updateProgramExerciseSchema);
  if (input.exercise_id) await getVisibleExercise(input.exercise_id, session.user.id);

  const data: Prisma.ProgramExerciseUncheckedUpdateInput = {};
  if (input.exercise_id !== undefined) data.exerciseId = input.exercise_id;
  if (input.position !== undefined) data.position = input.position;
  if (input.target_sets !== undefined) data.targetSets = input.target_sets;
  if (input.target_reps_min !== undefined) data.targetRepsMin = input.target_reps_min;
  if (input.target_reps_max !== undefined) data.targetRepsMax = input.target_reps_max;
  if (input.target_rpe !== undefined) data.targetRpe = input.target_rpe;
  if (input.rest_seconds !== undefined) data.restSeconds = input.rest_seconds;
  if (input.tempo !== undefined) data.tempo = input.tempo;
  if (input.is_warmup !== undefined) data.isWarmup = input.is_warmup;
  if (input.superset_group !== undefined) data.supersetGroup = input.superset_group;
  if (input.notes !== undefined) data.notes = input.notes;
  if (input.progression !== undefined) {
    data.progression = input.progression as Prisma.InputJsonValue;
  }

  try {
    const updated = await prisma.programExercise.update({
      where: { id: programExerciseId },
      data,
      include: { exercise: true }
    });
    return NextResponse.json({ data: serializeProgramExercise(updated) });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ApiError(409, "POSITION_TAKEN", "Another exercise already uses that position");
    }
    throw error;
  }
});

export const DELETE = withAuthApi(async ({ params, session }) => {
  const programId = String(params.programId);
  const sessionId = String(params.sessionId);
  const programExerciseId = String(params.programExerciseId);
  await getOwnedProgram(programId, session.user.id);

  const existing = await prisma.programExercise.findFirst({
    where: {
      id: programExerciseId,
      programSessionId: sessionId,
      session: { programId }
    },
    select: { id: true }
  });
  if (!existing) throw new ApiError(404, "NOT_FOUND", "Program exercise not found");

  await prisma.programExercise.delete({ where: { id: programExerciseId } });
  return new NextResponse(null, { status: 204 });
});
