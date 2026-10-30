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
import { track } from "@/lib/analytics";
import { createSession, attachSessionCookie, getEntitlement, toCurrentUser } from "@/lib/auth/session";

export const runtime = "nodejs";

// Valid Argon2id hash of a throwaway password. Verifying it for unknown emails
// keeps login latency flat and avoids user enumeration by timing.
const DUMMY_PASSWORD_HASH =
  "$argon2id$v=19$m=65536,t=3,p=1$BCzChgutrgiE23n1Insgsw$NR20YdLoA8smfI7lEnKiCevqnOTHGjoLxKuT5rV69UA";

export const POST = withApi(async ({ request }) => {
  const input = await parseJson(request, loginSchema);
  const ip = clientIp(request);
  const key = loginRateLimitKey(ip, input.email);

  const gate = await checkLoginRateLimit(key);
  if (!gate.allowed) {
    throw new ApiError(429, "RATE_LIMITED", "Too many login attempts", {
      headers: {
        ...rateLimitHeaders(0, gate.resetAt),
        "Retry-After": String(Math.max(1, Math.ceil((gate.resetAt - Date.now()) / 1000)))
      }
    });
  }

  const user = await prisma.user.findUnique({ where: { email: input.email } });
  const passwordOk = await verifyPassword(
    user?.passwordHash ?? DUMMY_PASSWORD_HASH,
    input.password
  );

  if (!user || !passwordOk || user.deletedAt || user.status !== "active") {
    await recordLoginFailure(key);
    const after = await checkLoginRateLimit(key);
    throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password", {
      headers: after.allowed ? undefined : rateLimitHeaders(0, after.resetAt)
    });
  }

  await clearLoginRateLimit(key);
  const now = new Date();
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: now } });

  const entitlement = await getEntitlement(user.id);
  const { session, rawToken } = await createSession(user.id, {
    ip,
    userAgent: request.headers.get("user-agent") ?? undefined
  });

  track("app_opened", user.id, { via: "login" });

  const response = NextResponse.json({
    data: {
      user: toCurrentUser(user, entitlement),
      expires_at: session.expiresAt.toISOString(),
      token: rawToken
    }
  });
  attachSessionCookie(response, rawToken);
  return response;
});
