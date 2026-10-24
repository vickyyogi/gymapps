import { NextResponse } from "next/server";
import { prisma, Prisma } from "@gymapps/db";
import { withAuthApi, parseJson, parseQuery } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { createExerciseSchema, exerciseListSchema } from "@/lib/api/phase3-validation";
import { pageArgs, pageResult } from "@/lib/api/pagination";
import { isUniqueViolation, slugify } from "@/lib/api/resources";
import { serializeExercise } from "@/lib/api/serializers";
import { newId } from "@/lib/id";

export const runtime = "nodejs";

export const GET = withAuthApi(async ({ request, session }) => {
  const query = parseQuery(request, exerciseListSchema);
  const conditions: Prisma.ExerciseWhereInput[] = [];

  if (query.include_custom) {
    conditions.push({
      OR: [{ ownerUserId: null }, { ownerUserId: session.user.id }]
    });
  } else {
    conditions.push({ ownerUserId: null, source: { not: "custom" } });
  }

  if (query.q) {
    // ponytail: ILIKE scan is enough for 200 seed rows; move to tsvector + GIN when the catalog grows.
    conditions.push({
      OR: [
        { nameId: { contains: query.q, mode: "insensitive" } },
        { nameEn: { contains: query.q, mode: "insensitive" } },
        { descriptionId: { contains: query.q, mode: "insensitive" } },
        { descriptionEn: { contains: query.q, mode: "insensitive" } }
      ]
    });
  }
  if (query.muscle) {
    conditions.push({
      OR: [{ primaryMuscle: query.muscle }, { secondaryMuscles: { has: query.muscle } }]
    });
  }
  if (query.equipment) {
    conditions.push({ equipment: { hasSome: query.equipment } });
  }
  if (query.difficulty) conditions.push({ difficulty: query.difficulty });
  if (query.available_only) {
    const profile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
      select: { equipment: true }
    });
    const owned = profile?.equipment.length ? profile.equipment : (["bodyweight"] as const);
    conditions.push({ equipment: { hasSome: [...owned] } });
  }

  const where: Prisma.ExerciseWhereInput = {
    deletedAt: null,
    status: "published",
    AND: conditions
  };

  const rows = await prisma.exercise.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    ...pageArgs(query.cursor, query.limit)
  });
  const page = pageResult(rows, query.limit);

  return NextResponse.json({
    data: page.data.map(serializeExercise),
    nextCursor: page.nextCursor
  });
});

export const POST = withAuthApi(async ({ request, session }) => {
  const input = await parseJson(request, createExerciseSchema);
  const id = newId("ex");
  const baseSlug = slugify(input.name_en ?? input.name_id) || "custom-exercise";
  const slug = `${baseSlug}-${id.slice(-8)}`;

  try {
    const exercise = await prisma.exercise.create({
      data: {
        id,
        slug,
        nameId: input.name_id,
        nameEn: input.name_en ?? input.name_id,
        descriptionId: input.description_id ?? null,
        descriptionEn: input.description_en ?? null,
        instructionsId: input.instructions_id,
        instructionsEn: input.instructions_en,
        primaryMuscle: input.primary_muscle,
        secondaryMuscles: input.secondary_muscles,
        equipment: input.equipment,
        difficulty: input.difficulty,
        status: "published",
        source: "custom",
        ownerUserId: session.user.id
      }
    });
    return NextResponse.json({ data: serializeExercise(exercise) }, { status: 201 });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ApiError(409, "EXERCISE_EXISTS", "Exercise slug already exists");
    }
    throw error;
  }
});
