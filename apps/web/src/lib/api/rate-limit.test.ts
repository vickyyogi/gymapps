import { describe, expect, it } from "vitest";
import { createMemoryRateLimitStore } from "@/lib/rate-limit-store";
import { consumeRateLimit } from "./rate-limit";

const policy = { limit: 2, windowMs: 1_000 };

function clockStore(start: number) {
  let at = start;
  return { store: createMemoryRateLimitStore(() => at), setTime: (next: number) => (at = next) };
}

describe("api rate limit", () => {
  it("allows up to the limit and blocks the next hit", async () => {
    const { store, setTime } = clockStore(1_000_000);
    expect((await consumeRateLimit("k", policy, store)).allowed).toBe(true);
    setTime(1_000_001);
    expect((await consumeRateLimit("k", policy, store)).allowed).toBe(true);
    setTime(1_000_002);
    const blocked = await consumeRateLimit("k", policy, store);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it("frees the slot once the window passes", async () => {
    const { store, setTime } = clockStore(2_000_000);
    await consumeRateLimit("k", policy, store);
    await consumeRateLimit("k", policy, store);
    expect((await consumeRateLimit("k", policy, store)).allowed).toBe(false);
    setTime(2_000_000 + policy.windowMs + 1);
    expect((await consumeRateLimit("k", policy, store)).allowed).toBe(true);
  });

  it("keeps keys isolated", async () => {
    const { store } = clockStore(3_000_000);
    await consumeRateLimit("a", policy, store);
    await consumeRateLimit("a", policy, store);
    expect((await consumeRateLimit("b", policy, store)).allowed).toBe(true);
  });
});
