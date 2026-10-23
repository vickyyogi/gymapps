import { NextResponse } from "next/server";
import { prisma } from "@gymapps/db";
import { withAuthApi, clientIp } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { getOwnedProgram, isUniqueViolation, programCompletionPct } from "@/lib/api/resources";
import { serializeProgram } from "@/lib/api/serializers";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";

export const POST = withAuthApi(async ({ request, params, session }) => {
  const programId = String(params.programId);
  await getOwnedProgram(programId, session.user.id);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.program.updateMany({
        where: {
          userId: session.user.id,
          status: "active",
          deletedAt: null,
          id: { not: programId }
        },
        data: { status: "archived" }
      });
      await tx.program.update({
        where: { id: programId },
        data: { status: "active" }
      });
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ApiError(409, "ACTIVE_PROGRAM_CONFLICT", "Another program is already active");
    }
    throw error;
  }

  const program = await getOwnedProgram(programId, session.user.id);
  const pct = await programCompletionPct(programId);

  await writeAudit({
    userId: session.user.id,
    action: "program.activated",
    entityType: "program",
    entityId: programId,
    after: { status: "active" },
    ipAddress: clientIp(request)
  });

  return NextResponse.json({ data: serializeProgram(program, pct) });
});
