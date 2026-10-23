import { NextResponse } from "next/server";
import { prisma, Prisma } from "@gymapps/db";
import { registerSchema } from "@gymapps/shared";
import { API_RATE_LIMITS } from "@gymapps/shared";
import { withApi, clientIp, parseJson } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { hashPassword } from "@/lib/auth/password";
import { createSession, attachSessionCookie, toCurrentUser } from "@/lib/auth/session";
import { newId } from "@/lib/id";

export const runtime = "nodejs";

export const POST = withApi(async ({ request }) => {
  enforceRateLimit("register", clientIp(request), API_RATE_LIMITS.register);
  const input = await parseJson(request, registerSchema);

  const existing = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true }
  });
  if (existing) {
    throw new ApiError(409, "EMAIL_TAKEN", "Email already registered");
  }

  const passwordHash = await hashPassword(input.password);
  const now = new Date();

  let user;
  try {
    user = await prisma.user.create({
      data: {
        id: newId("usr"),
        email: input.email,
        passwordHash,
        displayName: input.display_name ?? input.email.split("@")[0] ?? null,
        locale: input.locale,
        lastLoginAt: now,
        entitlements: {
          create: {
            id: newId("ent"),
            plan: "free",
            validFrom: now
          }
        }
      },
      include: { entitlements: true }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ApiError(409, "EMAIL_TAKEN", "Email already registered");
    }
    throw error;
  }

  const entitlement = user.entitlements[0] ?? null;
  const { session, rawToken } = await createSession(user.id, {
    ip: clientIp(request),
    userAgent: request.headers.get("user-agent") ?? undefined
  });

  const response = NextResponse.json(
    {
      data: {
        user: toCurrentUser(user, entitlement),
        expires_at: session.expiresAt.toISOString()
      }
    },
    { status: 201 }
  );
  attachSessionCookie(response, rawToken);
  return response;
});
