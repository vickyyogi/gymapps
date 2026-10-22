import { NextResponse } from "next/server";
import { prisma } from "@gymapps/db";
import { withAuthApi } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { deleteExportFile, exportStatus } from "@/lib/ai/exports";

export const runtime = "nodejs";

async function ownedExport(exportId: string, userId: string) {
  const row = await prisma.export.findUnique({ where: { id: exportId } });
  if (!row) throw new ApiError(404, "NOT_FOUND", "Export not found");
  if (row.userId !== userId) throw new ApiError(403, "FORBIDDEN", "Export belongs to another user");
  return row;
}

export const GET = withAuthApi(async ({ params, session }) => {
  const row = await ownedExport(String(params.exportId), session.user.id);
  return NextResponse.json({ data: await exportStatus(row) });
});

export const DELETE = withAuthApi(async ({ params, session }) => {
  const row = await ownedExport(String(params.exportId), session.user.id);
  await deleteExportFile(row);
  await prisma.export.delete({ where: { id: row.id } });
  return new NextResponse(null, { status: 204 });
});
