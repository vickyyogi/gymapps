import { NextResponse } from "next/server";
import { prisma } from "@gymapps/db";
import { withAuthApi, parseJson } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { programSessionSchema } from "@/lib/api/phase3-validation";
import { getOwnedProgram, isUniqueViolation } from "@/lib/api/resources";
import { newId } from "@/lib/id";

export const runtime = "nodejs";

export const POST = withAuthApi(async ({ request, params, session }) => {
  const programId = String(params.programId);
  await getOwnedProgram(programId, session.user.id);
  const input = await parseJson(request, programSessionSchema);

  const week = await prisma.programWeek.findFirst({
    where: { programId, weekNumber: input.week_number }
  });
  if (!week) throw new ApiError(404, "NOT_FOUND", "Program week not found");

  try {
    const created = await prisma.programSession.create({
      data: {
        id: newId("pss"),
        programId,
        programWeekId: week.id,
        dayIndex: input.day_index,
        name: input.name,
        notes: input.notes ?? null,
        estimatedMinutes: input.estimated_minutes ?? null
      }
    });

    return NextResponse.json(
      {
        data: {
          id: created.id,
          week_number: week.weekNumber,
          day_index: created.dayIndex,
          name: created.name,
          notes: created.notes,
          estimated_minutes: created.estimatedMinutes,
          completed_at: created.completedAt?.toISOString() ?? null,
          exercises: []
        }
      },
      { status: 201 }
    );
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ApiError(409, "SESSION_EXISTS", "A session already exists for that day");
    }
    throw error;
  }
});
