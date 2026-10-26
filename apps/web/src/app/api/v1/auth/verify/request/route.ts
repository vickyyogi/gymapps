import { NextResponse } from "next/server";
import { API_RATE_LIMITS, type Locale } from "@gymapps/shared";
import { withAuthApi } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { appUrl, emailEnabled, renderEmail, sendEmail } from "@/lib/email";
import { issueToken } from "@/lib/auth/verification";
import { log } from "@/lib/log";

export const runtime = "nodejs";

export const POST = withAuthApi(async ({ session }) => {
  await enforceRateLimit("verifyRequest", session.user.id, API_RATE_LIMITS.verifyRequest);
  if (!emailEnabled()) {
    throw new ApiError(503, "EMAIL_UNAVAILABLE", "Email delivery is not configured");
  }
  if (session.user.emailVerifiedAt) return new NextResponse(null, { status: 202 });

  const raw = await issueToken(session.user.email, "verify_email");
  const link = appUrl(`/${session.user.locale}/verify-email?token=${raw}`);
  try {
    await sendEmail({
      to: session.user.email,
      ...renderEmail("verify_email", session.user.locale as Locale, link)
    });
  } catch (error) {
    log("warn", "verify_email_send_failed", { user_id: session.user.id, error });
    throw new ApiError(502, "EMAIL_SEND_FAILED", "Failed to send verification email");
  }
  return new NextResponse(null, { status: 202 });
});
