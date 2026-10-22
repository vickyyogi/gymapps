import { NextResponse } from "next/server";
import { prisma, Prisma } from "@gymapps/db";
import { withAuthApi, parseJson, parseQuery } from "@/lib/api/handler";
import { programInputSchema, programListSchema } from "@/lib/api/phase3-validation";
import { pageArgs, pageResult } from "@/lib/api/pagination";
import { serializeProgram } from "@/lib/api/serializers";
import { newId } from "@/lib/id";

export const runtime = "nodejs";

export const GET = withAuthApi(async ({ request, session }) => {
  const query = parseQuery(request, programListSchema);
  const where: Prisma.ProgramWhereInput = {
    userId: session.user.id,
    deletedAt: null,
    ...(query.status ? { status: query.status } : {})
  };

  const rows = await prisma.program.findMany({
    where,
    include: { sessions: { select: { completedAt: true } } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    ...pageArgs(query.cursor, query.limit)
  });
  const page = pageResult(rows, query.limit);

  return NextResponse.json({
    data: page.data.map((program) => {
      const completed = program.sessions.filter((session) => session.completedAt).length;
      const pct = program.sessions.length ? (completed / program.sessions.length) * 100 : 0;
      return serializeProgram(program, pct);
    }),
    nextCursor: page.nextCursor
  });
});

export const POST = withAuthApi(async ({ request, session }) => {
  const input = await parseJson(request, programInputSchema);
  const id = newId("prg");

  const program = await prisma.program.create({
    data: {
      id,
      userId: session.user.id,
      name: input.name,
      description: input.description ?? null,
      goal: input.goal ?? null,
      splitType: input.split_type,
      durationWeeks: input.duration_weeks,
      daysPerWeek: input.days_per_week,
      sessionMinutes: input.session_minutes,
      startDate: input.start_date ?? null,
      progressionType: input.progression_type,
      status: "draft",
      source: "manual",
      weeks: {
        create: Array.from({ length: input.duration_weeks }, (_, index) => ({
          id: newId("pwk"),
          weekNumber: index + 1
        }))
      }
    }
  });

  return NextResponse.json({ data: serializeProgram(program, 0) }, { status: 201 });
});
