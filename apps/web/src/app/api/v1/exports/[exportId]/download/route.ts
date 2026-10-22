import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { prisma } from "@gymapps/db";
import { withAuthApi } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { verifyExportSignature } from "@/lib/ai/exports";

export const runtime = "nodejs";

export const GET = withAuthApi(async ({ request, params, session }) => {
  const row = await prisma.export.findUnique({ where: { id: String(params.exportId) } });
  if (!row) throw new ApiError(404, "NOT_FOUND", "Export not found");
  if (row.userId !== session.user.id) {
    throw new ApiError(403, "FORBIDDEN", "Export belongs to another user");
  }
  if (!row.expiresAt || row.expiresAt.getTime() <= Date.now()) {
    throw new ApiError(410, "EXPORT_EXPIRED", "Export link expired; generate a new export");
  }
  const token = request.nextUrl.searchParams.get("token") ?? "";
  if (!verifyExportSignature(row.id, row.userId, row.expiresAt, token)) {
    throw new ApiError(403, "FORBIDDEN", "Invalid export signature");
  }
  if (row.status !== "ready" || !row.filePath) {
    throw new ApiError(409, "EXPORT_NOT_READY", "Export is not ready");
  }

  let file: Buffer;
  try {
    file = await readFile(row.filePath);
  } catch {
    throw new ApiError(410, "EXPORT_EXPIRED", "Export file is no longer available");
  }
  const extension = row.type === "json" ? "json" : row.type === "csv" ? "csv" : "pdf";
  return new NextResponse(new Uint8Array(file), {
    headers: {
      "content-type":
        extension === "json"
          ? "application/json"
          : extension === "csv"
            ? "text/csv; charset=utf-8"
            : "application/pdf",
      "content-disposition": `attachment; filename="gymapps-${row.id}.${extension}"`,
      "content-length": String(file.byteLength),
      "cache-control": "private, no-store"
    }
  });
});
