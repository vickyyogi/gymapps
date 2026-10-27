import { NextResponse } from "next/server";
import { prisma } from "@gymapps/db";
import { withAuthApi } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { verifyExportSignature } from "@/lib/ai/exports";
import { getObject } from "@/lib/storage";

export const runtime = "nodejs";

export const GET = withAuthApi(async ({ request, params, session }) => {
  const row = await prisma.export.findUnique({ where: { id: String(params.reportId) } });
  if (!row || row.type !== "pdf_report") throw new ApiError(404, "NOT_FOUND", "Report not found");
  if (row.userId !== session.user.id) {
    throw new ApiError(403, "FORBIDDEN", "Report belongs to another user");
  }
  if (!row.expiresAt || row.expiresAt.getTime() <= Date.now()) {
    throw new ApiError(410, "EXPORT_EXPIRED", "Report link expired; generate a new report");
  }
  const token = request.nextUrl.searchParams.get("token") ?? "";
  if (!verifyExportSignature(row.id, row.userId, row.expiresAt, token)) {
    throw new ApiError(403, "FORBIDDEN", "Invalid report signature");
  }
  if (row.status !== "ready" || !row.filePath) {
    throw new ApiError(409, "EXPORT_NOT_READY", "Report is not ready");
  }
  let file: Buffer;
  try {
    file = await getObject(row.filePath);
  } catch {
    throw new ApiError(410, "EXPORT_EXPIRED", "Report file is no longer available");
  }
  return new NextResponse(new Uint8Array(file), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="gymapps-report-${row.id}.pdf"`,
      "content-length": String(file.byteLength),
      "cache-control": "private, no-store"
    }
  });
});
