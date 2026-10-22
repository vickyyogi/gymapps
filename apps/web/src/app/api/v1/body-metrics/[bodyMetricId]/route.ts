import { NextResponse } from "next/server";
import { prisma, Prisma } from "@gymapps/db";
import { withAuthApi, parseJson } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { bodyMetricUpdateSchema } from "@/lib/api/phase4-validation";
import { serializeBodyMetric } from "@/lib/api/phase4-serializers";

export const runtime = "nodejs";

async function owned(metricId: string, userId: string) {
  const metric = await prisma.bodyMetric.findFirst({
    where: { id: metricId, deletedAt: null }
  });
  if (!metric) throw new ApiError(404, "NOT_FOUND", "Body metric not found");
  if (metric.userId !== userId) {
    throw new ApiError(403, "FORBIDDEN", "Body metric belongs to another user");
  }
  return metric;
}

export const PATCH = withAuthApi(async ({ request, params, session }) => {
  const metric = await owned(String(params.bodyMetricId), session.user.id);
  const input = await parseJson(request, bodyMetricUpdateSchema);
  const data: Prisma.BodyMetricUncheckedUpdateInput = {};
  if (input.weight_kg !== undefined) data.weightKg = input.weight_kg;
  if (input.body_fat_pct !== undefined) data.bodyFatPct = input.body_fat_pct;
  if (input.chest_cm !== undefined) data.chestCm = input.chest_cm;
  if (input.waist_cm !== undefined) data.waistCm = input.waist_cm;
  if (input.hip_cm !== undefined) data.hipCm = input.hip_cm;
  if (input.arm_cm !== undefined) data.armCm = input.arm_cm;
  if (input.thigh_cm !== undefined) data.thighCm = input.thigh_cm;
  if (input.calf_cm !== undefined) data.calfCm = input.calf_cm;
  if (input.shoulder_cm !== undefined) data.shoulderCm = input.shoulder_cm;
  if (input.photo_urls !== undefined) data.photoUrls = input.photo_urls;
  if (input.notes !== undefined) data.notes = input.notes;

  const updated = await prisma.bodyMetric.update({ where: { id: metric.id }, data });
  return NextResponse.json({ data: serializeBodyMetric(updated) });
});

export const DELETE = withAuthApi(async ({ params, session }) => {
  const metric = await owned(String(params.bodyMetricId), session.user.id);
  await prisma.bodyMetric.update({
    where: { id: metric.id },
    data: { deletedAt: new Date() }
  });
  return new NextResponse(null, { status: 204 });
});
