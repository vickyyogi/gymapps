import { NextResponse } from "next/server";
import { prisma } from "@gymapps/db";
import { withAuthApi } from "@/lib/api/handler";

export const runtime = "nodejs";

export const POST = withAuthApi(async ({ session }) => {
  const result = await prisma.notification.updateMany({
    where: { userId: session.user.id, readAt: null },
    data: { readAt: new Date() }
  });
  return NextResponse.json({ data: { updated: result.count } });
});
