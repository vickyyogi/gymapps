import { NextResponse } from "next/server";
import { prisma } from "@gymapps/db";
import { API_RATE_LIMITS } from "@gymapps/shared";
import { withAuthApi, parseJson } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { feedbackSchema } from "@/lib/api/phase6-validation";

export const runtime = "nodejs";

export const POST = withAuthApi(async ({ request, params, session }) => {
  enforceRateLimit("coach-feedback", session.user.id, API_RATE_LIMITS.coachFeedback);
  const input = await parseJson(request, feedbackSchema);
  const message = await prisma.chatMessage.findUnique({
    where: { id: String(params.messageId) },
    include: { thread: { select: { userId: true } } }
  });
  if (!message) throw new ApiError(404, "NOT_FOUND", "Message not found");
  if (message.thread.userId !== session.user.id) {
    throw new ApiError(403, "FORBIDDEN", "Message belongs to another user");
  }
  if (message.role !== "assistant") {
    throw new ApiError(422, "VALIDATION_ERROR", "Feedback is only for assistant messages");
  }

  await prisma.chatMessage.update({
    where: { id: message.id },
    data: { feedback: input.rating, feedbackComment: input.comment ?? null }
  });
  return new NextResponse(null, { status: 204 });
});
