import { describe, expect, it } from "vitest";
import {
  changePasswordSchema,
  deleteAccountSchema,
  isAtLeastAge,
  registerSchema
} from "@gymapps/shared";
import { hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
  it("verifies the right password and rejects the wrong one", async () => {
    const hash = await hashPassword("correct horse battery");
    expect(hash.startsWith("$argon2id$")).toBe(true);
    expect(await verifyPassword(hash, "correct horse battery")).toBe(true);
    expect(await verifyPassword(hash, "wrong")).toBe(false);
  });

  it("returns false for a malformed hash", async () => {
    expect(await verifyPassword("not-a-hash", "anything")).toBe(false);
  });
});

describe("auth & account schemas (PDP / Tahap A)", () => {
  it("validates minimum age of 16 years", () => {
    const now = new Date("2026-10-24T00:00:00.000Z");
    expect(isAtLeastAge("2010-10-24", 16, now)).toBe(true);
    expect(isAtLeastAge("2000-01-01", 16, now)).toBe(true);
    expect(isAtLeastAge("2010-10-25", 16, now)).toBe(false);
    expect(isAtLeastAge("2015-05-10", 16, now)).toBe(false);
  });

  it("rejects register payload when birth_date is under 16 years old", () => {
    const underAge = registerSchema.safeParse({
      email: "teen@example.com",
      password: "Password123!",
      locale: "id",
      accept_terms: true,
      birth_date: "2018-01-01"
    });
    expect(underAge.success).toBe(false);

    const adult = registerSchema.safeParse({
      email: "adult@example.com",
      password: "Password123!",
      locale: "id",
      accept_terms: true,
      birth_date: "1998-05-20"
    });
    expect(adult.success).toBe(true);
  });

  it("validates changePasswordSchema and rejects identical new_password", () => {
    const same = changePasswordSchema.safeParse({
      current_password: "Password123!",
      new_password: "Password123!"
    });
    expect(same.success).toBe(false);

    const valid = changePasswordSchema.safeParse({
      current_password: "Password123!",
      new_password: "NewPassword456!"
    });
    expect(valid.success).toBe(true);
  });

  it("validates deleteAccountSchema 2-step confirmation", () => {
    const wrongConfirm = deleteAccountSchema.safeParse({
      password: "Password123!",
      confirm: "NO"
    });
    expect(wrongConfirm.success).toBe(false);

    const valid = deleteAccountSchema.safeParse({
      password: "Password123!",
      confirm: "DELETE",
      reason: "Testing account deletion"
    });
    expect(valid.success).toBe(true);
  });
});
