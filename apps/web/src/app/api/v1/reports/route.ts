import { NextResponse, after } from "next/server";
import { API_RATE_LIMITS } from "@gymapps/shared";
import { withAuthApi, parseJson, clientIp } from "@/lib/api/handler";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { reportCreateSchema } from "@/lib/api/phase6-validation";
import { createReportJob, runReport } from "@/lib/ai/reports";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const maxDuration = 60;

export const POST = withAuthApi(async ({ request, session }) => {
  await enforceRateLimit("report", session.user.id, API_RATE_LIMITS.reportCreate);
  const input = await parseJson(request, reportCreateSchema);
  const job = await createReportJob({
    userId: session.user.id,
    month: input.month,
    includeBodyMetrics: input.include_body_metrics
  });
  await writeAudit({
    userId: session.user.id,
    action: "report.requested",
    entityType: "export",
    entityId: job.id,
    after: { type: "pdf_report", month: input.month },
    ipAddress: clientIp(request)
  });
  after(() => runReport(job.id));
  return NextResponse.json(
    { data: { report_id: job.id, status: job.status } },
    { status: 202 }
  );
});
