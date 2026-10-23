import { describe, expect, it } from "vitest";
import { LOGIN_RATE_LIMIT } from "@gymapps/shared";
import { createMemoryRateLimitStore } from "@/lib/rate-limit-store";
import {
  checkLoginRateLimit,
  clearLoginRateLimit,
  loginRateLimitKey,
  recordLoginFailure
} from "./rate-limit";

const key = loginRateLimitKey("127.0.0.1", "USER@example.com");

function clockStore(start: number) {
  let at = start;
  const store = createMemoryRateLimitStore(() => at);
  return { store, setTime: (next: number) => (at = next) };
}

describe("login rate limit", () => {
  it("blocks the sixth attempt after five failures", async () => {
    const now = 1_000_000;
    const { store, setTime } = clockStore(now);
    expect((await checkLoginRateLimit(key, store)).allowed).toBe(true);

    for (let i = 0; i < LOGIN_RATE_LIMIT.maxFailures; i++) {
      setTime(now + i);
      await recordLoginFailure(key, store);
    }

    setTime(now + 10);
    expect((await checkLoginRateLimit(key, store)).allowed).toBe(false);
  });

  it("forgets failures after the window", async () => {
    const now = 1_000_000;
    const { store, setTime } = clockStore(now);
    await recordLoginFailure(key, store);
    setTime(now + LOGIN_RATE_LIMIT.windowMs + 1);
    expect((await checkLoginRateLimit(key, store)).allowed).toBe(true);
  });

  it("clears failures on successful login", async () => {
    const { store } = clockStore(1_000_000);
    for (let i = 0; i < LOGIN_RATE_LIMIT.maxFailures; i++) {
      await recordLoginFailure(key, store);
    }
    await clearLoginRateLimit(key, store);
    expect((await checkLoginRateLimit(key, store)).allowed).toBe(true);
  });

  it("normalizes email in the key", () => {
    expect(loginRateLimitKey("1.1.1.1", " A@B.com ")).toBe("1.1.1.1:a@b.com");
  });
});
