import { NextResponse } from "next/server";
import { prisma, Prisma } from "@gymapps/db";
import { withAuthApi, parseJson, parseQuery } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { startWorkoutSchema, workoutListSchema } from "@/lib/api/phase3-validation";
import { pageArgs, pageResult } from "@/lib/api/pagination";
import { expireAbandonedWorkouts } from "@/lib/api/resources";
import {
  serializeWorkout,
  serializeWorkoutDetail,
  workoutDetailInclude,
  workoutSummaryInclude
} from "@/lib/api/serializers";
import { newId } from "@/lib/id";

export const runtime = "nodejs";

export const GET = withAuthApi(async ({ request, session }) => {
  await expireAbandonedWorkouts(session.user.id);
  const query = parseQuery(request, workoutListSchema);

  const where: Prisma.WorkoutWhereInput = {
    userId: session.user.id,
    deletedAt: null,
    ...(query.status ? { status: query.status } : {}),
    ...(query.program_id ? { programId: query.program_id } : {}),
    ...(query.from || query.to
      ? {
          startedAt: {
            ...(query.from ? { gte: query.from } : {}),
            ...(query.to
              ? { lt: new Date(query.to.getTime() + 24 * 60 * 60 * 1000) }
              : {})
          }
        }
      : {})
  };

  const rows = await prisma.workout.findMany({
    where,
    include: workoutSummaryInclude,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    ...pageArgs(query.cursor, query.limit)
  });
  const page = pageResult(rows, query.limit);

  return NextResponse.json({
    data: page.data.map((workout) =>
      serializeWorkout(workout, {
        exerciseCount: workout.exercises.length,
        prCount: workout.sets.length
      })
    ),
    nextCursor: page.nextCursor
  });
});

export const POST = withAuthApi(async ({ request, session }) => {
  await expireAbandonedWorkouts(session.user.id);
  const input = await parseJson(request, startWorkoutSchema);

  if (input.source === "template") {
    throw new ApiError(422, "VALIDATION_ERROR", "Template workouts are not available yet", {
      details: [{ path: "source", message: "Use quick or program" }]
    });
  }

  let programId: string | null = null;
  let programSessionId: string | null = null;
  let title = input.title ?? "Quick workout";
  let programExercises: Array<{
    exerciseId: string;
    position: number;
    notes: string | null;
    supersetGroup: number | null;
  }> = [];

  if (input.source === "program") {
    if (!input.program_session_id) {
      throw new ApiError(422, "VALIDATION_ERROR", "program_session_id is required", {
        details: [{ path: "program_session_id", message: "Required for program workouts" }]
      });
    }

    const programSession = await prisma.programSession.findUnique({
      where: { id: input.program_session_id },
      include: {
        program: true,
        exercises: { orderBy: { position: "asc" } }
      }
    });
    if (!programSession) throw new ApiError(404, "NOT_FOUND", "Program session not found");
    if (programSession.program.userId !== session.user.id) {
      throw new ApiError(403, "FORBIDDEN", "Program session belongs to another user");
    }

    programId = programSession.programId;
    programSessionId = programSession.id;
    title = input.title ?? programSession.name;
    programExercises = programSession.exercises.map((item) => ({
      exerciseId: item.exerciseId,
      position: item.position,
      notes: item.notes,
      supersetGroup: item.supersetGroup
    }));
  }

  const workoutId = newId("wkt");
  await prisma.workout.create({
    data: {
      id: workoutId,
      userId: session.user.id,
      programId,
      programSessionId,
      title,
      status: "active",
      startedAt: input.started_at ?? new Date(),
      exercises:
        programExercises.length > 0
          ? {
              create: programExercises.map((item) => ({
                id: newId("wex"),
                exerciseId: item.exerciseId,
                position: item.position,
                notes: item.notes,
                supersetGroup: item.supersetGroup
              }))
            }
          : undefined
    }
  });

  const workout = await prisma.workout.findUniqueOrThrow({
    where: { id: workoutId },
    include: workoutDetailInclude
  });
  return NextResponse.json({ data: serializeWorkoutDetail(workout) }, { status: 201 });
});
