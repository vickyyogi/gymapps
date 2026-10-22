import { NextResponse } from "next/server";
import { prisma } from "@gymapps/db";
import { withAuthApi, parseQuery } from "@/lib/api/handler";
import { notificationListSchema } from "@/lib/api/phase6-validation";
import { serializeNotification } from "@/lib/api/phase6-serializers";

export const runtime = "nodejs";

export const GET = withAuthApi(async ({ request, session }) => {
  const query = parseQuery(request, notificationListSchema);
  const [rows, unread] = await Promise.all([
    prisma.notification.findMany({
      where: {
        userId: session.user.id,
        ...(query.unread_only ? { readAt: null } : {})
      },
      orderBy: { createdAt: "desc" },
      take: query.limit
    }),
    prisma.notification.count({ where: { userId: session.user.id, readAt: null } })
  ]);
  return NextResponse.json({
    data: rows.map(serializeNotification),
    meta: { unread_count: unread }
  });
});
