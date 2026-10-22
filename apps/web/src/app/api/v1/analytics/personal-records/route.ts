import { NextResponse } from "next/server";
import { withAuthApi, parseQuery } from "@/lib/api/handler";
import { analyticsPersonalRecords } from "@/lib/api/analytics";
import { analyticsPrSchema } from "@/lib/api/phase4-validation";

export const runtime = "nodejs";

export const GET = withAuthApi(async ({ request, session }) => {
  const query = parseQuery(request, analyticsPrSchema);
  return NextResponse.json({
    data: await analyticsPersonalRecords(session.user.id, query.exercise_id, query.limit)
  });
});
