import { afterEach, describe, expect, it } from "vitest";
import { LOGIN_RATE_LIMIT } from "@gymapps/shared";
import {
  checkLoginRateLimit,
  clearLoginRateLimit,
  loginRateLimitKey,
  recordLoginFailure
} from "./rate-limit";

const key = loginRateLimitKey("127.0.0.1", "USER@example.com");

afterEach(() => clearLoginRateLimit(key));

describe("login rate limit", () => {
  it("blocks the sixth attempt after five failures", () => {
    const now = 1_000_000;
    expect(checkLoginRateLimit(key, now).allowed).toBe(true);

    for (let i = 0; i < LOGIN_RATE_LIMIT.maxFailures; i++) {
      recordLoginFailure(key, now + i);
    }

    expect(checkLoginRateLimit(key, now + 10).allowed).toBe(false);
  });

  it("forgets failures outside the window", () => {
    const now = 1_000_000;
    recordLoginFailure(key, now);
    expect(
      checkLoginRateLimit(key, now + LOGIN_RATE_LIMIT.windowMs + 1).allowed
    ).toBe(true);
  });

  it("normalizes email in the key", () => {
    expect(loginRateLimitKey("1.1.1.1", " A@B.com ")).toBe("1.1.1.1:a@b.com");
  });
});
