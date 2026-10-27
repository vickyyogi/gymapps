import "server-only";

import { randomBytes } from "node:crypto";
import { prisma } from "@gymapps/db";
import { EMAIL_VERIFY_TTL_MS, PASSWORD_RESET_TTL_MS } from "@gymapps/shared";
import { hashToken } from "@/lib/auth/session";

export type TokenPurpose = "verify_email" | "reset_password";

const TTL_MS: Record<TokenPurpose, number> = {
  verify_email: EMAIL_VERIFY_TTL_MS,
  reset_password: PASSWORD_RESET_TTL_MS
};

// Raw token only exists in the email link; the DB stores its SHA-256 hash.
export async function issueToken(identifier: string, purpose: TokenPurpose) {
  const raw = randomBytes(32).toString("base64url");
  const now = new Date();
  await prisma.$transaction([
    prisma.verificationToken.updateMany({
      where: { identifier, purpose, usedAt: null },
      data: { usedAt: now }
    }),
    prisma.verificationToken.create({
      data: {
        identifier,
        tokenHash: hashToken(raw),
        purpose,
        expires: new Date(now.getTime() + TTL_MS[purpose])
      }
    })
  ]);
  return raw;
}

export async function consumeToken(raw: string, purpose: TokenPurpose) {
  const tokenHash = hashToken(raw);
  const row = await prisma.verificationToken.findUnique({ where: { tokenHash } });
  if (!row || row.purpose !== purpose || row.usedAt || row.expires <= new Date()) return null;
  const claimed = await prisma.verificationToken.updateMany({
    where: { tokenHash, usedAt: null },
    data: { usedAt: new Date() }
  });
  return claimed.count === 1 ? row : null;
}
