import { NextResponse } from "next/server";
import { prisma } from "@gymapps/db";
import { API_RATE_LIMITS, resetPasswordSchema } from "@gymapps/shared";
import { withApi, clientIp, parseJson } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { hashPassword } from "@/lib/auth/password";
import { consumeToken } from "@/lib/auth/verification";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";

export const POST = withApi(async ({ request }) => {
  await enforceRateLimit("passwordReset", clientIp(request), API_RATE_LIMITS.passwordReset);
  const input = await parseJson(request, resetPasswordSchema);

  const row = await consumeToken(input.token, "reset_password");
  if (!row) {
    throw new ApiError(422, "INVALID_TOKEN", "Token invalid or expired");
  }
  const user = await prisma.user.findUnique({ where: { email: row.identifier } });
  if (!user || user.deletedAt) {
    throw new ApiError(422, "INVALID_TOKEN", "Token invalid or expired");
  }

  const passwordHash = await hashPassword(input.password);
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
    prisma.session.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() }
    })
  ]);

  await writeAudit({
    userId: user.id,
    action: "password.changed",
    entityType: "user",
    entityId: user.id,
    after: { via: "reset", all_sessions_revoked: true },
    ipAddress: clientIp(request)
  });

  return new NextResponse(null, { status: 204 });
});
