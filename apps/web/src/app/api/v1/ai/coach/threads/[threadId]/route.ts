import { NextResponse } from "next/server";
import { prisma } from "@gymapps/db";
import { withAuthApi } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";

export const runtime = "nodejs";

async function ownedThread(threadId: string, userId: string) {
  const thread = await prisma.chatThread.findUnique({ where: { id: threadId } });
  if (!thread || thread.deletedAt) throw new ApiError(404, "NOT_FOUND", "Thread not found");
  if (thread.userId !== userId) throw new ApiError(403, "FORBIDDEN", "Thread belongs to another user");
  return thread;
}

export const DELETE = withAuthApi(async ({ params, session }) => {
  const thread = await ownedThread(String(params.threadId), session.user.id);
  await prisma.chatThread.update({
    where: { id: thread.id },
    data: { deletedAt: new Date() }
  });
  return new NextResponse(null, { status: 204 });
});
