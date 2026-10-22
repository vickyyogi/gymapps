import { NextResponse } from "next/server";
import { withAuthApi, parseQuery } from "@/lib/api/handler";
import { analyticsCalendar } from "@/lib/api/analytics";
import { analyticsWeeksSchema } from "@/lib/api/phase4-validation";

export const runtime = "nodejs";

export const GET = withAuthApi(async ({ request, session }) => {
  const query = parseQuery(request, analyticsWeeksSchema);
  return NextResponse.json({ data: await analyticsCalendar(session.user.id, query.weeks) });
});
