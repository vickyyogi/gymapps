import { NextResponse } from "next/server";
import { prisma, Prisma } from "@gymapps/db";
import { registerSchema } from "@gymapps/shared";
import { API_RATE_LIMITS } from "@gymapps/shared";
import { withApi, clientIp, parseJson } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { hashPassword } from "@/lib/auth/password";
import { createSession, attachSessionCookie, toCurrentUser } from "@/lib/auth/session";
import { issueToken } from "@/lib/auth/verification";
import { appUrl, emailEnabled, renderEmail, sendEmail } from "@/lib/email";
import { track } from "@/lib/analytics";
import { log } from "@/lib/log";
import { newId } from "@/lib/id";

export const runtime = "nodejs";

export const POST = withApi(async ({ request }) => {
  await enforceRateLimit("register", clientIp(request), API_RATE_LIMITS.register);
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
  // Tanpa provider email tidak ada yang bisa diverifikasi; jangan kunci user di dev.
  const emailVerifiedAt = emailEnabled() ? null : now;

  let user;
  try {
    user = await prisma.user.create({
      data: {
        id: newId("usr"),
        email: input.email,
        passwordHash,
        displayName: input.display_name ?? input.email.split("@")[0] ?? null,
        locale: input.locale,
        emailVerifiedAt,
        lastLoginAt: now,
        entitlements: {
          create: {
            id: newId("ent"),
            plan: "free",
            validFrom: now
          }
        },
        ...(input.birth_date
          ? {
              profile: {
                create: {
                  birthDate: new Date(`${input.birth_date}T00:00:00.000Z`)
                }
              }
            }
          : {})
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

  if (emailEnabled()) {
    try {
      const raw = await issueToken(user.email, "verify_email");
      const link = appUrl(`/${user.locale}/verify-email?token=${raw}`);
      await sendEmail({
        to: user.email,
        ...renderEmail("verify_email", user.locale, link)
      });
    } catch (error) {
      // Registrasi tetap sukses; user bisa kirim ulang lewat /auth/verify/request.
      log("warn", "verify_email_send_failed", { user_id: user.id, error });
    }
  }

  const { session, rawToken } = await createSession(user.id, {
    ip: clientIp(request),
    userAgent: request.headers.get("user-agent") ?? undefined
  });

  track("user_registered", user.id, { locale: user.locale });

  const response = NextResponse.json(
    {
      data: {
        user: toCurrentUser(user, entitlement),
        expires_at: session.expiresAt.toISOString(),
        token: rawToken
      }
    },
    { status: 201 }
  );
  attachSessionCookie(response, rawToken);
  return response;
});
