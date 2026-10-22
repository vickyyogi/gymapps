import { NextResponse } from "next/server";
import { prisma } from "@gymapps/db";
import { withAuthApi } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { exportSignature, exportStatus } from "@/lib/ai/exports";

export const runtime = "nodejs";

export const GET = withAuthApi(async ({ params, session }) => {
  const row = await prisma.export.findUnique({ where: { id: String(params.reportId) } });
  if (!row || row.type !== "pdf_report") throw new ApiError(404, "NOT_FOUND", "Report not found");
  if (row.userId !== session.user.id) {
    throw new ApiError(403, "FORBIDDEN", "Report belongs to another user");
  }
  const status = await exportStatus(row);
  const token =
    row.status === "ready" && row.expiresAt && row.expiresAt.getTime() > Date.now()
      ? exportSignature(row.id, row.userId, row.expiresAt)
      : null;
  return NextResponse.json({
    data: {
      report_id: row.id,
      status: row.status,
      download_url: token
        ? `/api/v1/reports/${row.id}/download?token=${encodeURIComponent(token)}`
        : null,
      expires_at: status.expires_at,
      file_size_bytes: status.file_size_bytes,
      error_message: status.error_message
    }
  });
});
