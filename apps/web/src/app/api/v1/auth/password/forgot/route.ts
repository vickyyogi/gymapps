import { NextResponse } from "next/server";
import { prisma } from "@gymapps/db";
import { API_RATE_LIMITS, forgotPasswordSchema, type Locale } from "@gymapps/shared";
import { withApi, parseJson } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { appUrl, emailEnabled, renderEmail, sendEmail } from "@/lib/email";
import { issueToken } from "@/lib/auth/verification";
import { log } from "@/lib/log";

export const runtime = "nodejs";

export const POST = withApi(async ({ request }) => {
  const { email } = await parseJson(request, forgotPasswordSchema);
  await enforceRateLimit("passwordForgot", email, API_RATE_LIMITS.passwordForgot);
  if (!emailEnabled()) {
    throw new ApiError(503, "EMAIL_UNAVAILABLE", "Email delivery is not configured");
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (user && !user.deletedAt) {
    try {
      const raw = await issueToken(user.email, "reset_password");
      const link = appUrl(`/${user.locale}/reset-password?token=${raw}`);
      await sendEmail({
        to: user.email,
        ...renderEmail("reset_password", user.locale as Locale, link)
      });
    } catch (error) {
      // Still 202: a 500 only for existing emails would leak account existence.
      log("warn", "password_reset_email_failed", { error });
    }
  }
  return new NextResponse(null, { status: 202 });
});
