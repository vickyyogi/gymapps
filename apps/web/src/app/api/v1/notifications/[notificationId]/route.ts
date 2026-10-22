import { NextResponse } from "next/server";
import { prisma } from "@gymapps/db";
import { withAuthApi } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { serializeNotification } from "@/lib/api/phase6-serializers";

export const runtime = "nodejs";

export const PATCH = withAuthApi(async ({ params, session }) => {
  const row = await prisma.notification.findUnique({
    where: { id: String(params.notificationId) }
  });
  if (!row) throw new ApiError(404, "NOT_FOUND", "Notification not found");
  if (row.userId !== session.user.id) {
    throw new ApiError(403, "FORBIDDEN", "Notification belongs to another user");
  }
  const updated = await prisma.notification.update({
    where: { id: row.id },
    data: { readAt: row.readAt ?? new Date() }
  });
  return NextResponse.json({ data: serializeNotification(updated) });
});
