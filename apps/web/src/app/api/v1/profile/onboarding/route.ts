import { NextResponse } from "next/server";
import { prisma } from "@gymapps/db";
import { withAuthApi, parseJson } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { onboardingSchema } from "@/lib/api/phase4-validation";
import { emailEnabled } from "@/lib/email";

export const runtime = "nodejs";

export const POST = withAuthApi(async ({ request, session }) => {
  // FR-01-08: verifikasi email wajib sebelum akses onboarding.
  if (emailEnabled() && !session.user.emailVerifiedAt) {
    throw new ApiError(403, "EMAIL_NOT_VERIFIED", "Verify your email before onboarding");
  }

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
