import { NextResponse } from "next/server";
import { withAuthApi } from "@/lib/api/handler";
import { jobResponse } from "@/lib/ai/orchestrator";

export const runtime = "nodejs";

export const GET = withAuthApi(async ({ params, session }) => {
  const data = await jobResponse(String(params.jobId), session.user.id);
  return NextResponse.json({ data });
});
