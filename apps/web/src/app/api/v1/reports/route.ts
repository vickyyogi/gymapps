import { NextResponse, after } from "next/server";
import { withAuthApi, parseJson } from "@/lib/api/handler";
import { reportCreateSchema } from "@/lib/api/phase6-validation";
import { createReportJob, runReport } from "@/lib/ai/reports";

export const runtime = "nodejs";
export const maxDuration = 60;

export const POST = withAuthApi(async ({ request, session }) => {
  const input = await parseJson(request, reportCreateSchema);
  const job = await createReportJob({
    userId: session.user.id,
    month: input.month,
    includeBodyMetrics: input.include_body_metrics
  });
  after(() => runReport(job.id));
  return NextResponse.json(
    { data: { report_id: job.id, status: job.status } },
    { status: 202 }
  );
});
