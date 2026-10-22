import { NextResponse } from "next/server";
import { prisma } from "@gymapps/db";
import { withAuthApi, parseJson, parseQuery } from "@/lib/api/handler";
import { bodyMetricListSchema, bodyMetricSchema } from "@/lib/api/phase4-validation";
import { serializeBodyMetric } from "@/lib/api/phase4-serializers";
import { newId } from "@/lib/id";

export const runtime = "nodejs";

export const GET = withAuthApi(async ({ request, session }) => {
  const query = parseQuery(request, bodyMetricListSchema);
  const rows = await prisma.bodyMetric.findMany({
    where: {
      userId: session.user.id,
      deletedAt: null,
      ...(query.from || query.to
        ? {
            recordedOn: {
              ...(query.from ? { gte: query.from } : {}),
              ...(query.to ? { lte: query.to } : {})
            }
          }
        : {})
    },
    orderBy: [{ recordedOn: "desc" }, { id: "desc" }],
    take: query.limit
  });
  return NextResponse.json({ data: rows.map(serializeBodyMetric) });
});

export const POST = withAuthApi(async ({ request, session }) => {
  const input = await parseJson(request, bodyMetricSchema);
  const fields = {
    weightKg: input.weight_kg ?? null,
    bodyFatPct: input.body_fat_pct ?? null,
    chestCm: input.chest_cm ?? null,
    waistCm: input.waist_cm ?? null,
    hipCm: input.hip_cm ?? null,
    armCm: input.arm_cm ?? null,
    thighCm: input.thigh_cm ?? null,
    calfCm: input.calf_cm ?? null,
    shoulderCm: input.shoulder_cm ?? null,
    photoUrls: input.photo_urls ?? [],
    notes: input.notes ?? null,
    deletedAt: null
  };

  const metric = await prisma.bodyMetric.upsert({
    where: {
      userId_recordedOn: { userId: session.user.id, recordedOn: input.recorded_on }
    },
    update: fields,
    create: {
      id: newId("bmt"),
      userId: session.user.id,
      recordedOn: input.recorded_on,
      ...fields
    }
  });
  return NextResponse.json({ data: serializeBodyMetric(metric) }, { status: 201 });
});
