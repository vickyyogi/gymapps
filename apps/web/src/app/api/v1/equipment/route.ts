import { NextResponse } from "next/server";
import { prisma } from "@gymapps/db";
import { withAuthApi } from "@/lib/api/handler";

export const runtime = "nodejs";

export const GET = withAuthApi(async () => {
  const rows = await prisma.equipment.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json({
    data: rows.map((row) => ({
      code: row.code,
      name_id: row.nameId,
      name_en: row.nameEn
    }))
  });
});
