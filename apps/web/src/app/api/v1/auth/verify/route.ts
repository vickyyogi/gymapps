import { NextResponse } from "next/server";
import { prisma } from "@gymapps/db";
import { API_RATE_LIMITS, verifyEmailSchema } from "@gymapps/shared";
import { withApi, clientIp, parseJson } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { consumeToken } from "@/lib/auth/verification";

export const runtime = "nodejs";

export const POST = withApi(async ({ request }) => {
  await enforceRateLimit("verifyConsume", clientIp(request), API_RATE_LIMITS.verifyConsume);
  const { token } = await parseJson(request, verifyEmailSchema);

  const row = await consumeToken(token, "verify_email");
  if (!row) {
    throw new ApiError(422, "INVALID_TOKEN", "Token invalid or expired");
  }

  await prisma.user.updateMany({
    where: { email: row.identifier, deletedAt: null },
    data: { emailVerifiedAt: new Date() }
  });
  return new NextResponse(null, { status: 204 });
});
