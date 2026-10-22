import { NextResponse } from "next/server";
import { withAuthApi, parseQuery } from "@/lib/api/handler";
import { analyticsSummary } from "@/lib/api/analytics";
import { analyticsRangeSchema } from "@/lib/api/phase4-validation";

export const runtime = "nodejs";

export const GET = withAuthApi(async ({ request, session }) => {
  const query = parseQuery(request, analyticsRangeSchema);
  return NextResponse.json({ data: await analyticsSummary(session.user.id, query.range) });
});
