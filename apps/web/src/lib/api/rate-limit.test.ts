import { describe, expect, it } from "vitest";
import { consumeRateLimit } from "./rate-limit";

const policy = { limit: 2, windowMs: 1_000 };

describe("api rate limit", () => {
  it("allows up to the limit and blocks the next hit", () => {
    const key = "test:limit";
    const now = 1_000_000;
    expect(consumeRateLimit(key, policy, now).allowed).toBe(true);
    expect(consumeRateLimit(key, policy, now + 1).allowed).toBe(true);
    const blocked = consumeRateLimit(key, policy, now + 2);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it("frees the slot once the window passes", () => {
    const key = "test:window";
    const now = 2_000_000;
    consumeRateLimit(key, policy, now);
    consumeRateLimit(key, policy, now + 1);
    expect(consumeRateLimit(key, policy, now + 2).allowed).toBe(false);
    expect(consumeRateLimit(key, policy, now + policy.windowMs + 1).allowed).toBe(true);
  });

  it("keeps keys isolated", () => {
    const now = 3_000_000;
    consumeRateLimit("test:a", policy, now);
    consumeRateLimit("test:a", policy, now + 1);
    expect(consumeRateLimit("test:b", policy, now + 2).allowed).toBe(true);
  });
});
