import { NextResponse } from "next/server";
import { prisma } from "@gymapps/db";
import { withAuthApi, parseJson, clientIp } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { programInputSchema } from "@/lib/api/phase3-validation";
import { getOwnedProgram, programCompletionPct } from "@/lib/api/resources";
import { programDetailInclude, serializeProgram, serializeProgramDetail } from "@/lib/api/serializers";
import { writeAudit } from "@/lib/audit";
import { newId } from "@/lib/id";

export const runtime = "nodejs";

export const GET = withAuthApi(async ({ params, session }) => {
  const programId = String(params.programId);
  const program = await prisma.program.findFirst({
    where: { id: programId, deletedAt: null },
    include: programDetailInclude
  });
  if (!program) throw new ApiError(404, "NOT_FOUND", "Program not found");
  if (program.userId !== session.user.id) {
    throw new ApiError(403, "FORBIDDEN", "Program belongs to another user");
  }
  return NextResponse.json({ data: serializeProgramDetail(program) });
});

export const PATCH = withAuthApi(async ({ request, params, session }) => {
  const programId = String(params.programId);
  const current = await getOwnedProgram(programId, session.user.id);
  const input = await parseJson(request, programInputSchema);

  await prisma.$transaction(async (tx) => {
    const weeks = await tx.programWeek.findMany({
      where: { programId },
      orderBy: { weekNumber: "asc" },
      include: { _count: { select: { sessions: true } } }
    });

    if (input.duration_weeks > weeks.length) {
      await tx.programWeek.createMany({
        data: Array.from(
          { length: input.duration_weeks - weeks.length },
          (_, index) => ({
            id: newId("pwk"),
            programId,
            weekNumber: weeks.length + index + 1
          })
        ),
        skipDuplicates: true
      });
    } else if (input.duration_weeks < weeks.length) {
      const removable = weeks.filter((week) => week.weekNumber > input.duration_weeks);
      if (removable.some((week) => week._count.sessions > 0)) {
        throw new ApiError(
          409,
          "PROGRAM_HAS_SESSIONS",
          "Remove sessions before reducing the program duration"
        );
      }
      await tx.programWeek.deleteMany({
        where: { id: { in: removable.map((week) => week.id) } }
      });
    }

    await tx.program.update({
      where: { id: programId },
      data: {
        name: input.name,
        description: input.description ?? null,
        goal: input.goal ?? null,
        splitType: input.split_type,
        durationWeeks: input.duration_weeks,
        daysPerWeek: input.days_per_week,
        sessionMinutes: input.session_minutes,
        startDate: input.start_date ?? current.startDate,
        progressionType: input.progression_type
      }
    });
  });

  const updated = await getOwnedProgram(programId, session.user.id);
  const pct = await programCompletionPct(programId);

  await writeAudit({
    userId: session.user.id,
    action: "program.updated",
    entityType: "program",
    entityId: programId,
    before: {
      name: current.name,
      duration_weeks: current.durationWeeks,
      days_per_week: current.daysPerWeek
    },
    after: {
      name: input.name,
      duration_weeks: input.duration_weeks,
      days_per_week: input.days_per_week
    },
    ipAddress: clientIp(request)
  });

  return NextResponse.json({ data: serializeProgram(updated, pct) });
});

export const DELETE = withAuthApi(async ({ request, params, session }) => {
  const programId = String(params.programId);
  await getOwnedProgram(programId, session.user.id);
  await prisma.program.update({
    where: { id: programId },
    data: { status: "archived" }
  });

  await writeAudit({
    userId: session.user.id,
    action: "program.archived",
    entityType: "program",
    entityId: programId,
    after: { status: "archived" },
    ipAddress: clientIp(request)
  });

  return new NextResponse(null, { status: 204 });
});
