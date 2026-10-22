import { NextResponse } from "next/server";
import { prisma } from "@gymapps/db";
import { withAuthApi, parseJson } from "@/lib/api/handler";
import { onboardingSchema } from "@/lib/api/phase4-validation";

export const runtime = "nodejs";

export const POST = withAuthApi(async ({ request, session }) => {
  const input = await parseJson(request, onboardingSchema);
  const done = input.step === "done";

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: done ? { onboardingCompletedAt: new Date() } : {}
  });

  return NextResponse.json({
    onboarding_completed: Boolean(user.onboardingCompletedAt),
    step: input.step
  });
});
