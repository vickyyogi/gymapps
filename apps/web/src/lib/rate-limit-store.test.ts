import { describe, expect, it } from "vitest";
import {
  createDbRateLimitStore,
  createMemoryRateLimitStore,
  type RawDb,
  type RateLimitStore
} from "@/lib/rate-limit-store";

const at = 1_700_000_000_000;

function stubDb(row: { count: number; reset_at: Date }): RawDb {
  return {
    $queryRaw: async () => [row] as never,
    $executeRaw: async () => 1
  };
}

describe("createDbRateLimitStore", () => {
  it("maps returned row to window", async () => {
    const store = createDbRateLimitStore(stubDb({ count: 3, reset_at: new Date(at + 1500) }), createMemoryRateLimitStore(), () => at);
    await expect(store.hit("k", 60_000)).resolves.toEqual({ count: 3, resetInMs: 1500 });
  });

  it("falls back to memory store when db fails", async () => {
    const failing: RawDb = {
      $queryRaw: async () => {
        throw new Error("down");
      },
      $executeRaw: async () => {
        throw new Error("down");
      }
    };
    const fallback: RateLimitStore = createMemoryRateLimitStore(() => at);
    const store = createDbRateLimitStore(failing, fallback, () => at);
    await store.hit("k", 60_000);
    await expect(store.current("k")).resolves.toEqual({ count: 1, resetInMs: 60_000 });
  });
});

// Real SQL check; runs only when Postgres is configured.
describe.skipIf(!process.env.DATABASE_URL)("db round-trip", () => {
  it("counts, reads and resets via rate_limits table", async () => {
    const { prisma } = await import("@gymapps/db");
    const { createDbRateLimitStore: create } = await import("@/lib/rate-limit-store");
    const store = create(prisma, createMemoryRateLimitStore());
    const key = `test:rl:${Date.now()}`;
    try {
      await expect(store.hit(key, 60_000)).resolves.toMatchObject({ count: 1 });
      await expect(store.hit(key, 60_000)).resolves.toMatchObject({ count: 2 });
      await expect(store.current(key)).resolves.toMatchObject({ count: 2 });
      await store.reset(key);
      await expect(store.current(key)).resolves.toEqual({ count: 0, resetInMs: 0 });
    } finally {
      await store.reset(key);
    }
  });
});
