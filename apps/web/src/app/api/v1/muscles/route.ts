import { NextResponse } from "next/server";
import { prisma } from "@gymapps/db";
import { withAuthApi } from "@/lib/api/handler";

export const runtime = "nodejs";

const GROUPS: Record<string, "push" | "pull" | "legs" | "core" | "full_body" | "cardio"> = {
  chest: "push",
  shoulders: "push",
  triceps: "push",
  back: "pull",
  lats: "pull",
  biceps: "pull",
  forearms: "pull",
  traps: "pull",
  quads: "legs",
  hamstrings: "legs",
  glutes: "legs",
  calves: "legs",
  adductors: "legs",
  abductors: "legs",
  abs: "core",
  obliques: "core",
  core: "core",
  lower_back: "core",
  full_body: "full_body",
  cardio: "cardio"
};

export const GET = withAuthApi(async () => {
  const rows = await prisma.muscle.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json({
    data: rows.map((row) => ({
      code: row.code,
      name_id: row.nameId,
      name_en: row.nameEn,
      group: GROUPS[row.code] ?? "full_body"
    }))
  });
});
