import { NextResponse } from "next/server";
import { prisma } from "@gymapps/db";
import { withAuthApi, parseJson, parseQuery, clientIp } from "@/lib/api/handler";
import { createExerciseSchema } from "@/lib/api/phase3-validation";
import { exerciseAdminListSchema } from "@/lib/api/phase6-validation";
import { requireAdmin } from "@/lib/auth/admin";
import { serializeExercise } from "@/lib/api/serializers";
import { slugify } from "@/lib/api/resources";
import { newId } from "@/lib/id";

export const runtime = "nodejs";

export const GET = withAuthApi(async ({ request, session }) => {
  requireAdmin(session);
  const query = parseQuery(request, exerciseAdminListSchema);
  const rows = await prisma.exercise.findMany({
    where: {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.q
        ? {
            OR: [
              { nameId: { contains: query.q, mode: "insensitive" } },
              { nameEn: { contains: query.q, mode: "insensitive" } },
              { slug: { contains: query.q, mode: "insensitive" } }
            ]
          }
        : {})
    },
    orderBy: [{ updatedAt: "desc" }],
    take: query.limit
  });
  return NextResponse.json({
    data: rows.map((row) => ({
      ...serializeExercise(row),
      description_id: row.descriptionId,
      description_en: row.descriptionEn,
      instructions_id: row.instructionsId,
      instructions_en: row.instructionsEn,
      secondary_muscles: row.secondaryMuscles,
      equipment: row.equipment,
      difficulty: row.difficulty,
      impact_level: row.impactLevel,
      contraindicated_areas: row.contraindicatedAreas,
      is_compound: row.isCompound,
      review_notes: row.reviewNotes,
      updated_at: row.updatedAt.toISOString()
    }))
  });
});

export const POST = withAuthApi(async ({ request, session }) => {
  requireAdmin(session);
  const input = await parseJson(request, createExerciseSchema);
  const id = newId("ex");
  const slug = `${slugify(input.name_en ?? input.name_id) || "exercise"}-${id.slice(-8)}`;
  const row = await prisma.exercise.create({
    data: {
      id,
      slug,
      nameId: input.name_id,
      nameEn: input.name_en ?? input.name_id,
      descriptionId: input.description_id ?? null,
      instructionsId: input.instructions_id,
      instructionsEn: [],
      primaryMuscle: input.primary_muscle,
      secondaryMuscles: input.secondary_muscles,
      equipment: input.equipment,
      difficulty: input.difficulty,
      status: "draft",
      source: "admin"
    }
  });
  await prisma.auditLog.create({
    data: {
      id: newId("aud"),
      actorId: session.user.id,
      action: "exercise.created",
      entityType: "exercise",
      entityId: row.id,
      after: { name_id: row.nameId, status: row.status },
      ipAddress: clientIp(request)
    }
  });
  return NextResponse.json({ data: serializeExercise(row) }, { status: 201 });
});
