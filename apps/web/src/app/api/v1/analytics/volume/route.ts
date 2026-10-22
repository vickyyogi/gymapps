import { NextResponse } from "next/server";
import { withAuthApi, parseQuery } from "@/lib/api/handler";
import { analyticsVolume } from "@/lib/api/analytics";
import { analyticsVolumeSchema } from "@/lib/api/phase4-validation";

export const runtime = "nodejs";

export const GET = withAuthApi(async ({ request, session }) => {
  const query = parseQuery(request, analyticsVolumeSchema);
  return NextResponse.json({
    data: await analyticsVolume(session.user.id, query.range, query.exercise_id, query.muscle)
  });
});
