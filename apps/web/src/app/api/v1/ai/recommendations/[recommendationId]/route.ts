import { NextResponse } from "next/server";
import { prisma } from "@gymapps/db";
import { withAuthApi, parseJson } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { recommendationUpdateSchema } from "@/lib/api/phase6-validation";
import { serializeRecommendation } from "@/lib/api/phase6-serializers";

export const runtime = "nodejs";

const DISMISS_DAYS = 30;

export const PATCH = withAuthApi(async ({ request, params, session }) => {
  const input = await parseJson(request, recommendationUpdateSchema);
  const row = await prisma.aiRecommendation.findUnique({
    where: { id: String(params.recommendationId) }
  });
  if (!row) throw new ApiError(404, "NOT_FOUND", "Recommendation not found");
  if (row.userId !== session.user.id) {
    throw new ApiError(403, "FORBIDDEN", "Recommendation belongs to another user");
  }

  const now = new Date();
  const updated = await prisma.aiRecommendation.update({
    where: { id: row.id },
    data: {
      status: input.status,
      ...(input.status === "dismissed"
        ? {
            dismissedUntil: new Date(now.getTime() + DISMISS_DAYS * 24 * 60 * 60 * 1000),
            expiresAt: new Date(now.getTime() + DISMISS_DAYS * 24 * 60 * 60 * 1000)
          }
        : {})
    }
  });
  return NextResponse.json({ data: serializeRecommendation(updated) });
});
