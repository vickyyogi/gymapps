import { NextResponse } from "next/server";
import { prisma } from "@gymapps/db";
import { withAuthApi, parseJson } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { programExerciseSchema } from "@/lib/api/phase3-validation";
import {
  getOwnedProgram,
  getVisibleExercise,
  isUniqueViolation
} from "@/lib/api/resources";
import { serializeProgramExercise } from "@/lib/api/serializers";
import { newId } from "@/lib/id";

export const runtime = "nodejs";

export const POST = withAuthApi(async ({ request, params, session }) => {
  const programId = String(params.programId);
  const sessionId = String(params.sessionId);
  await getOwnedProgram(programId, session.user.id);

  const programSession = await prisma.programSession.findFirst({
    where: { id: sessionId, programId }
  });
  if (!programSession) throw new ApiError(404, "NOT_FOUND", "Program session not found");

  const input = await parseJson(request, programExerciseSchema);
  await getVisibleExercise(input.exercise_id, session.user.id);

  const position =
    input.position ??
    ((await prisma.programExercise.aggregate({
      where: { programSessionId: sessionId },
      _max: { position: true }
    }))._max.position ?? 0) + 1;

  try {
    const created = await prisma.programExercise.create({
      data: {
        id: newId("pex"),
        programSessionId: sessionId,
        exerciseId: input.exercise_id,
        position,
        targetSets: input.target_sets,
        targetRepsMin: input.target_reps_min,
        targetRepsMax: input.target_reps_max,
        targetRpe: input.target_rpe ?? null,
        restSeconds: input.rest_seconds,
        tempo: input.tempo ?? null,
        isWarmup: input.is_warmup,
        supersetGroup: input.superset_group ?? null,
        notes: input.notes ?? null,
        progression: input.progression ?? undefined
      },
      include: { exercise: true }
    });
    return NextResponse.json({ data: serializeProgramExercise(created) }, { status: 201 });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ApiError(409, "POSITION_TAKEN", "Another exercise already uses that position");
    }
    throw error;
  }
});
