import { NextResponse } from "next/server";
import { prisma } from "@gymapps/db";
import { API_RATE_LIMITS, deleteAccountSchema } from "@gymapps/shared";
import { withAuthApi, parseJson, clientIp } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { verifyPassword } from "@/lib/auth/password";
import { clearSessionCookie, revokeAllSessions } from "@/lib/auth/session";
import { ACCOUNT_RETENTION_DAYS } from "@/lib/account-retention";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";

export const DELETE = withAuthApi(
  async ({ request, session }) => {
    await enforceRateLimit("accountDelete", session.user.id, API_RATE_LIMITS.accountDelete);
    const input = await parseJson(request, deleteAccountSchema);

    const passwordOk = await verifyPassword(session.user.passwordHash, input.password);
    if (!passwordOk) {
      throw new ApiError(401, "INVALID_CREDENTIALS", "Incorrect password");
    }

    const now = new Date();
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        status: "pending_delete",
        deletedAt: now
      }
    });
    await revokeAllSessions(session.user.id);

    // ADR-004: store audit log without PII so it survives 30-day hard delete safely.
    await writeAudit({
      userId: session.user.id,
      action: "account.deleted",
      entityType: "user",
      entityId: session.user.id,
      after: {
        status: "pending_delete",
        hard_delete_after_days: ACCOUNT_RETENTION_DAYS
      },
      ipAddress: clientIp(request)
    });

    const response = NextResponse.json({
      data: {
        status: "pending_delete" as const,
        hard_delete_after_days: ACCOUNT_RETENTION_DAYS
      }
    });
    clearSessionCookie(response);
    return response;
  },
  { refreshSession: false }
);
