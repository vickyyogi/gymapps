import { NextResponse } from "next/server";
import { prisma, Prisma } from "@gymapps/db";
import { withAuthApi, parseJson } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { noteUpdateSchema } from "@/lib/api/phase4-validation";
import { serializeNote } from "@/lib/api/phase4-serializers";

export const runtime = "nodejs";

async function owned(noteId: string, userId: string) {
  const note = await prisma.note.findFirst({ where: { id: noteId, deletedAt: null } });
  if (!note) throw new ApiError(404, "NOT_FOUND", "Note not found");
  if (note.userId !== userId) throw new ApiError(403, "FORBIDDEN", "Note belongs to another user");
  return note;
}

export const PATCH = withAuthApi(async ({ request, params, session }) => {
  const note = await owned(String(params.noteId), session.user.id);
  const input = await parseJson(request, noteUpdateSchema);
  const data: Prisma.NoteUncheckedUpdateInput = {};
  if (input.body !== undefined) data.body = input.body;
  if (input.category !== undefined) data.category = input.category;
  if (input.is_pinned !== undefined) data.isPinned = input.is_pinned;
  if (input.workout_id !== undefined) {
    if (input.workout_id) {
      const workout = await prisma.workout.findFirst({
        where: { id: input.workout_id, deletedAt: null },
        select: { userId: true }
      });
      if (!workout) throw new ApiError(404, "NOT_FOUND", "Workout not found");
      if (workout.userId !== session.user.id) {
        throw new ApiError(403, "FORBIDDEN", "Workout belongs to another user");
      }
      data.workoutId = input.workout_id;
    } else {
      data.workoutId = null;
    }
  }

  const updated = await prisma.note.update({ where: { id: note.id }, data });
  return NextResponse.json({ data: serializeNote(updated) });
});

export const DELETE = withAuthApi(async ({ params, session }) => {
  const note = await owned(String(params.noteId), session.user.id);
  await prisma.note.update({ where: { id: note.id }, data: { deletedAt: new Date() } });
  return new NextResponse(null, { status: 204 });
});
