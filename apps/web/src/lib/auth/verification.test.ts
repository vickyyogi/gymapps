import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { consumeToken, issueToken } from "@/lib/auth/verification";

describe("verification tokens", () => {
  it("is single-use and purpose-bound", async ({ skip }) => {
    if (!process.env.DATABASE_URL) skip();
    const { prisma } = await import("@gymapps/db");
    const identifier = `test-verify-${Date.now()}@example.com`;

    const raw = await issueToken(identifier, "verify_email");
    expect(await consumeToken(raw, "reset_password")).toBeNull();
    expect(await consumeToken(raw, "verify_email")).toMatchObject({ identifier });
    expect(await consumeToken(raw, "verify_email")).toBeNull();

    // Token lama untuk purpose sama mati saat token baru diterbitkan.
    const first = await issueToken(identifier, "reset_password");
    await issueToken(identifier, "reset_password");
    expect(await consumeToken(first, "reset_password")).toBeNull();

    await prisma.verificationToken.deleteMany({ where: { identifier } });
  });
});
