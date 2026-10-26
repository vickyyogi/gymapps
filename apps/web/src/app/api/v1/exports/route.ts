import { NextResponse } from "next/server";
import { prisma } from "@gymapps/db";
import { API_RATE_LIMITS } from "@gymapps/shared";
import { withAuthApi, parseJson, clientIp } from "@/lib/api/handler";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { exportCreateSchema } from "@/lib/api/phase6-validation";
import { createExportJob, exportStatus } from "@/lib/ai/exports";
import { writeAudit } from "@/lib/audit";
import { enqueue } from "@/lib/jobs";

export const runtime = "nodejs";

export const GET = withAuthApi(async ({ session }) => {
  const rows = await prisma.export.findMany({
    where: { userId: session.user.id, type: { in: ["json", "csv", "pdf_report"] } },
    orderBy: { createdAt: "desc" },
    take: 20
  });
  const data = await Promise.all(rows.map((row) => exportStatus(row)));
  return NextResponse.json({ data });
});

export const POST = withAuthApi(async ({ request, session }) => {
  await enforceRateLimit("export", session.user.id, API_RATE_LIMITS.exportCreate);
  const input = await parseJson(request, exportCreateSchema);
  const job = await createExportJob({
    userId: session.user.id,
    format: input.format,
    entities: input.entities,
    from: input.from,
    to: input.to
  });
  await writeAudit({
    userId: session.user.id,
    action: "export.requested",
    entityType: "export",
    entityId: job.id,
    after: { format: input.format, entities: job.entities },
    ipAddress: clientIp(request)
  });
  await enqueue("export", job.id);
  return NextResponse.json(
    { data: { export_id: job.id, status: job.status } },
    { status: 202 }
  );
});
