import { NextResponse } from "next/server";
import { prisma, Prisma } from "@gymapps/db";
import { withAuthApi, parseJson, parseQuery } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { noteListSchema, noteSchema } from "@/lib/api/phase4-validation";
import { pageArgs, pageResult } from "@/lib/api/pagination";
import { serializeNote } from "@/lib/api/phase4-serializers";
import { newId } from "@/lib/id";

export const runtime = "nodejs";

async function validateWorkout(workoutId: string | undefined, userId: string) {
  if (!workoutId) return undefined;
  const workout = await prisma.workout.findFirst({
    where: { id: workoutId, deletedAt: null },
    select: { userId: true }
  });
  if (!workout) throw new ApiError(404, "NOT_FOUND", "Workout not found");
  if (workout.userId !== userId) {
    throw new ApiError(403, "FORBIDDEN", "Workout belongs to another user");
  }
  return workoutId;
}

export const GET = withAuthApi(async ({ request, session }) => {
  const query = parseQuery(request, noteListSchema);
  const where: Prisma.NoteWhereInput = {
    userId: session.user.id,
    deletedAt: null,
    ...(query.category ? { category: query.category } : {})
  };
  const rows = await prisma.note.findMany({
    where,
    orderBy: query.pinned_first
      ? [{ isPinned: "desc" }, { createdAt: "desc" }, { id: "desc" }]
      : [{ createdAt: "desc" }, { id: "desc" }],
    ...pageArgs(query.cursor, query.limit)
  });
  const page = pageResult(rows, query.limit);
  return NextResponse.json({
    data: page.data.map(serializeNote),
    nextCursor: page.nextCursor
  });
});

export const POST = withAuthApi(async ({ request, session }) => {
  const input = await parseJson(request, noteSchema);
  const workoutId = await validateWorkout(input.workout_id, session.user.id);
  const note = await prisma.note.create({
    data: {
      id: newId("note"),
      userId: session.user.id,
      workoutId: workoutId ?? null,
      body: input.body,
      category: input.category,
      isPinned: input.is_pinned
    }
  });
  return NextResponse.json({ data: serializeNote(note) }, { status: 201 });
});
