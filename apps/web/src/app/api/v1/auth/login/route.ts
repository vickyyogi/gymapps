import { NextResponse } from "next/server";
import { prisma } from "@gymapps/db";
import { loginSchema } from "@gymapps/shared";
import { withApi, clientIp, parseJson, rateLimitHeaders } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { verifyPassword } from "@/lib/auth/password";
import {
  checkLoginRateLimit,
  clearLoginRateLimit,
  loginRateLimitKey,
  recordLoginFailure
} from "@/lib/auth/rate-limit";
import { createSession, attachSessionCookie, getEntitlement, toCurrentUser } from "@/lib/auth/session";

export const runtime = "nodejs";

export const POST = withApi(async ({ request }) => {
  const input = await parseJson(request, loginSchema);
  const ip = clientIp(request);
  const key = loginRateLimitKey(ip, input.email);

  const gate = checkLoginRateLimit(key);
  if (!gate.allowed) {
    throw new ApiError(429, "RATE_LIMITED", "Too many login attempts", {
      headers: {
        ...rateLimitHeaders(0, gate.resetAt),
        "Retry-After": String(Math.max(1, Math.ceil((gate.resetAt - Date.now()) / 1000)))
      }
    });
  }

  const user = await prisma.user.findUnique({ where: { email: input.email } });
  const passwordOk = user ? await verifyPassword(user.passwordHash, input.password) : false;

  if (!user || !passwordOk || user.deletedAt || user.status !== "active") {
    recordLoginFailure(key);
    const after = checkLoginRateLimit(key);
    throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password", {
      headers: after.allowed ? undefined : rateLimitHeaders(0, after.resetAt)
    });
  }

  clearLoginRateLimit(key);
  const now = new Date();
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: now } });

  const entitlement = await getEntitlement(user.id);
  const { session, rawToken } = await createSession(user.id, {
    ip,
    userAgent: request.headers.get("user-agent") ?? undefined
  });

  const response = NextResponse.json({
    data: {
      user: toCurrentUser(user, entitlement),
      expires_at: session.expiresAt.toISOString()
    }
  });
  attachSessionCookie(response, rawToken);
  return response;
});
