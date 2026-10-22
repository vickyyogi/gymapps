import "server-only";

import { cache } from "react";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { prisma, type Entitlement, type Session, type User } from "@gymapps/db";
import {
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
  SESSION_TTL_SECONDS,
  type CurrentUser
} from "@gymapps/shared";
import { ApiError } from "@/lib/api/errors";
import { newId } from "@/lib/id";

export type ActiveSession = {
  session: Session;
  user: User;
  rawToken: string;
};

export function hashToken(rawToken: string) {
  return createHash("sha256").update(rawToken).digest("hex");
}

export async function createSession(
  userId: string,
  meta: { ip?: string; userAgent?: string }
) {
  const rawToken = randomBytes(32).toString("base64url");
  const now = new Date();

  const session = await prisma.session.create({
    data: {
      id: newId("ses"),
      sessionTokenHash: hashToken(rawToken),
      userId,
      expiresAt: new Date(now.getTime() + SESSION_TTL_MS),
      lastUsedAt: now,
      ipAddress: meta.ip?.slice(0, 64) ?? null,
      userAgent: meta.userAgent?.slice(0, 512) ?? null
    }
  });

  return { session, rawToken };
}

export function attachSessionCookie(response: NextResponse, rawToken: string) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: rawToken,
    httpOnly: true,
    // FR-01-03 says Secure always. Browsers refuse Secure cookies on http://localhost.
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    path: "/",
    maxAge: 0
  });
}

export const getSession = cache(async (): Promise<ActiveSession | null> => {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!rawToken) return null;

  const now = new Date();
  const session = await prisma.session.findUnique({
    where: { sessionTokenHash: hashToken(rawToken) },
    include: { user: true }
  });

  if (
    !session ||
    session.revokedAt ||
    session.expiresAt <= now ||
    session.user.deletedAt ||
    session.user.status !== "active"
  ) {
    return null;
  }

  const touched = await prisma.session.update({
    where: { id: session.id },
    data: {
      lastUsedAt: now,
      expiresAt: new Date(now.getTime() + SESSION_TTL_MS)
    }
  });

  return { session: touched, user: session.user, rawToken };
});

export async function requireSession(): Promise<ActiveSession> {
  const session = await getSession();
  if (!session) {
    throw new ApiError(401, "UNAUTHENTICATED", "Authentication required");
  }
  return session;
}

export async function revokeSession(sessionId: string) {
  await prisma.session.updateMany({
    where: { id: sessionId, revokedAt: null },
    data: { revokedAt: new Date() }
  });
}

export async function revokeAllSessions(userId: string) {
  await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() }
  });
}

export async function getEntitlement(userId: string) {
  return prisma.entitlement.findFirst({
    where: {
      userId,
      OR: [{ validUntil: null }, { validUntil: { gt: new Date() } }]
    },
    orderBy: { validFrom: "desc" }
  });
}

export function toCurrentUser(user: User, entitlement: Entitlement | null): CurrentUser {
  return {
    id: user.id,
    email: user.email,
    display_name: user.displayName,
    locale: user.locale as CurrentUser["locale"],
    unit_system: user.unitSystem as CurrentUser["unit_system"],
    timezone: user.timezone,
    theme: user.theme as CurrentUser["theme"],
    onboarding_completed: Boolean(user.onboardingCompletedAt),
    entitlement: {
      plan: (entitlement?.plan ?? "free") as "free" | "pro",
      ai_chat_daily_limit: entitlement?.aiChatDailyLimit ?? 30,
      ai_generate_daily_limit: entitlement?.aiGenerateDailyLimit ?? 5,
      features: (entitlement?.features ?? {}) as Record<string, unknown>
    }
  };
}
