import { NextResponse } from "next/server";
import { prisma } from "@gymapps/db";
import { withAuthApi, parseJson, clientIp } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { exerciseAdminUpdateSchema } from "@/lib/api/phase6-validation";
import { requireAdmin } from "@/lib/auth/admin";
import { serializeExercise } from "@/lib/api/serializers";
import { newId } from "@/lib/id";

export const runtime = "nodejs";

export const PATCH = withAuthApi(async ({ request, params, session }) => {
  requireAdmin(session);
  const id = String(params.exerciseId);
  const before = await prisma.exercise.findFirst({ where: { id, deletedAt: null } });
  if (!before) throw new ApiError(404, "NOT_FOUND", "Exercise not found");
  const input = await parseJson(request, exerciseAdminUpdateSchema);

  const row = await prisma.exercise.update({
    where: { id },
    data: {
      ...(input.name_id !== undefined ? { nameId: input.name_id } : {}),
      ...(input.name_en !== undefined ? { nameEn: input.name_en } : {}),
      ...(input.description_id !== undefined ? { descriptionId: input.description_id } : {}),
      ...(input.description_en !== undefined ? { descriptionEn: input.description_en } : {}),
      ...(input.instructions_id !== undefined ? { instructionsId: input.instructions_id } : {}),
      ...(input.instructions_en !== undefined ? { instructionsEn: input.instructions_en } : {}),
      ...(input.primary_muscle !== undefined ? { primaryMuscle: input.primary_muscle } : {}),
      ...(input.secondary_muscles !== undefined
        ? { secondaryMuscles: input.secondary_muscles }
        : {}),
      ...(input.equipment !== undefined ? { equipment: input.equipment } : {}),
      ...(input.difficulty !== undefined ? { difficulty: input.difficulty } : {}),
      ...(input.impact_level !== undefined ? { impactLevel: input.impact_level } : {}),
      ...(input.contraindicated_areas !== undefined
        ? { contraindicatedAreas: input.contraindicated_areas }
        : {}),
      ...(input.is_compound !== undefined ? { isCompound: input.is_compound } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.review_notes !== undefined ? { reviewNotes: input.review_notes } : {})
    }
  });

  await prisma.auditLog.create({
    data: {
      id: newId("aud"),
      actorId: session.user.id,
      action: input.status === "published" ? "exercise.published" : "exercise.updated",
      entityType: "exercise",
      entityId: row.id,
      before: {
        name_id: before.nameId,
        instructions_id: before.instructionsId,
        status: before.status
      },
      after: {
        name_id: row.nameId,
        instructions_id: row.instructionsId,
        status: row.status
      },
      ipAddress: clientIp(request)
    }
  });

  return NextResponse.json({ data: serializeExercise(row) });
});
