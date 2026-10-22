import { NextResponse } from "next/server";
import { prisma } from "@gymapps/db";
import { withAuthApi, parseQuery } from "@/lib/api/handler";
import { recommendationListSchema } from "@/lib/api/phase6-validation";
import { serializeRecommendation } from "@/lib/api/phase6-serializers";

export const runtime = "nodejs";

const SEVERITY_ORDER = { P1: 0, P2: 1, P3: 2 } as Record<string, number>;

export const GET = withAuthApi(async ({ request, session }) => {
  const query = parseQuery(request, recommendationListSchema);
  const rows = await prisma.aiRecommendation.findMany({
    where: {
      userId: session.user.id,
      ...(query.status ? { status: query.status } : {}),
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
    },
    orderBy: [{ createdAt: "desc" }],
    take: query.limit
  });
  rows.sort(
    (a, b) =>
      (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9) ||
      b.createdAt.getTime() - a.createdAt.getTime()
  );
  return NextResponse.json({ data: rows.map(serializeRecommendation) });
});
