import { NextResponse } from "next/server";
import { withAuthApi, parseQuery } from "@/lib/api/handler";
import { analyticsOneRm } from "@/lib/api/analytics";
import { analyticsOneRmSchema } from "@/lib/api/phase4-validation";

export const runtime = "nodejs";

export const GET = withAuthApi(async ({ request, session }) => {
  const query = parseQuery(request, analyticsOneRmSchema);
  return NextResponse.json({
    data: await analyticsOneRm(session.user.id, query.exercise_id, query.range)
  });
});
