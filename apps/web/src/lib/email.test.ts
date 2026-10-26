import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { renderEmail } from "@/lib/email";

describe("renderEmail", () => {
  it("renders verify email with link in both locales", () => {
    for (const locale of ["id", "en"]) {
      const email = renderEmail("verify_email", locale, "https://app.test/verify-email?token=abc");
      expect(email.subject.length).toBeGreaterThan(0);
      expect(email.text).toContain("https://app.test/verify-email?token=abc");
    }
  });

  it("renders reset email with expiry hint", () => {
    const email = renderEmail("reset_password", "id", "https://app.test/reset-password?token=xyz");
    expect(email.text).toContain("60 menit");
    expect(email.text).toContain("https://app.test/reset-password?token=xyz");
  });

  it("falls back to id for unknown locale", () => {
    const email = renderEmail("verify_email", "fr", "https://app.test/x");
    expect(email).toEqual(renderEmail("verify_email", "id", "https://app.test/x"));
  });
});
