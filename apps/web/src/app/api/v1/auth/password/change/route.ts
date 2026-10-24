import { NextResponse } from "next/server";
import { prisma } from "@gymapps/db";
import { API_RATE_LIMITS, changePasswordSchema } from "@gymapps/shared";
import { withAuthApi, parseJson, clientIp } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";

export const POST = withAuthApi(async ({ request, session }) => {
  await enforceRateLimit("passwordChange", session.user.id, API_RATE_LIMITS.passwordChange);
  const input = await parseJson(request, changePasswordSchema);

  const ok = await verifyPassword(session.user.passwordHash, input.current_password);
  if (!ok) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Current password is incorrect");
  }

  const passwordHash = await hashPassword(input.new_password);
  const now = new Date();

  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash }
    }),
    prisma.session.updateMany({
      where: {
        userId: session.user.id,
        id: { not: session.session.id },
        revokedAt: null
      },
      data: { revokedAt: now }
    })
  ]);

  await writeAudit({
    userId: session.user.id,
    action: "password.changed",
    entityType: "user",
    entityId: session.user.id,
    after: { other_sessions_revoked: true },
    ipAddress: clientIp(request)
  });

  return new NextResponse(null, { status: 204 });
});
