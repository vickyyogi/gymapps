import { NextResponse } from "next/server";
import { prisma, Prisma } from "@gymapps/db";
import { withAuthApi } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { serializeProgram } from "@/lib/api/serializers";
import { newId } from "@/lib/id";

export const runtime = "nodejs";

export const POST = withAuthApi(async ({ params, session }) => {
  const programId = String(params.programId);
  const source = await prisma.program.findFirst({
    where: { id: programId, deletedAt: null },
    include: {
      weeks: {
        orderBy: { weekNumber: "asc" },
        include: {
          sessions: {
            orderBy: { dayIndex: "asc" },
            include: { exercises: { orderBy: { position: "asc" } } }
          }
        }
      }
    }
  });
  if (!source) throw new ApiError(404, "NOT_FOUND", "Program not found");
  if (source.userId !== session.user.id) {
    throw new ApiError(403, "FORBIDDEN", "Program belongs to another user");
  }

  const id = newId("prg");
  const copy = await prisma.$transaction(async (tx) => {
    const program = await tx.program.create({
      data: {
        id,
        userId: session.user.id,
        name: `${source.name} (copy)`.slice(0, 80),
        description: source.description,
        status: "draft",
        source: source.source,
        goal: source.goal,
        splitType: source.splitType,
        durationWeeks: source.durationWeeks,
        daysPerWeek: source.daysPerWeek,
        sessionMinutes: source.sessionMinutes,
        progressionType: source.progressionType,
        aiGenerated: source.aiGenerated,
        aiRationale:
          source.aiRationale === null
            ? undefined
            : (source.aiRationale as Prisma.InputJsonValue)
      }
    });

    for (const week of source.weeks) {
      const weekId = newId("pwk");
      await tx.programWeek.create({
        data: {
          id: weekId,
          programId: id,
          weekNumber: week.weekNumber,
          focusNote: week.focusNote,
          isDeload: week.isDeload,
          volumeMultiplier: week.volumeMultiplier
        }
      });

      for (const session of week.sessions) {
        const sessionId = newId("pss");
        await tx.programSession.create({
          data: {
            id: sessionId,
            programId: id,
            programWeekId: weekId,
            dayIndex: session.dayIndex,
            name: session.name,
            notes: session.notes,
            estimatedMinutes: session.estimatedMinutes
          }
        });

        if (session.exercises.length > 0) {
          await tx.programExercise.createMany({
            data: session.exercises.map((item) => ({
              id: newId("pex"),
              programSessionId: sessionId,
              exerciseId: item.exerciseId,
              position: item.position,
              targetSets: item.targetSets,
              targetRepsMin: item.targetRepsMin,
              targetRepsMax: item.targetRepsMax,
              targetRpe: item.targetRpe,
              restSeconds: item.restSeconds,
              tempo: item.tempo,
              isWarmup: item.isWarmup,
              supersetGroup: item.supersetGroup,
              notes: item.notes,
              progression:
                item.progression === null
                  ? undefined
                  : (item.progression as Prisma.InputJsonValue),
              aiGenerated: item.aiGenerated
            }))
          });
        }
      }
    }

    return program;
  });

  return NextResponse.json({ data: serializeProgram(copy, 0) }, { status: 201 });
});
