import { prisma } from "@gymapps/db";
import { log } from "@/lib/log";

export type RateLimitWindow = { count: number; resetInMs: number };

export type RateLimitStore = {
  hit(key: string, windowMs: number): Promise<RateLimitWindow>;
  current(key: string): Promise<RateLimitWindow>;
  reset(key: string): Promise<void>;
};

type MemoryEntry = { count: number; resetAt: number };

// Per-instance fallback, used when Upstash is not configured or unreachable.
export function createMemoryRateLimitStore(now = () => Date.now()): RateLimitStore {
  const entries = new Map<string, MemoryEntry>();

  function live(key: string, at: number) {
    const entry = entries.get(key);
    if (!entry || entry.resetAt <= at) {
      entries.delete(key);
      return undefined;
    }
    return entry;
  }

  return {
    async hit(key, windowMs) {
      const at = now();
      if (entries.size >= 10_000) {
        for (const [stale, entry] of entries) {
          if (entry.resetAt <= at) entries.delete(stale);
        }
      }
      const entry = live(key, at) ?? { count: 0, resetAt: at + windowMs };
      entry.count += 1;
      entries.set(key, entry);
      return { count: entry.count, resetInMs: entry.resetAt - at };
    },
    async current(key) {
      const at = now();
      const entry = live(key, at);
      return { count: entry?.count ?? 0, resetInMs: entry ? entry.resetAt - at : 0 };
    },
    async reset(key) {
      entries.delete(key);
    }
  };
}

// Minimal raw-SQL surface so tests can stub the database.
export type RawDb = {
  $queryRaw<T>(query: TemplateStringsArray, ...values: unknown[]): PromiseLike<T>;
  $executeRaw(query: TemplateStringsArray, ...values: unknown[]): PromiseLike<number>;
};

type HitRow = { count: number; reset_at: Date };

// Single-statement upsert: atomic across instances, window resets only when expired.
export function createDbRateLimitStore(
  db: RawDb,
  fallback: RateLimitStore,
  now = () => Date.now()
): RateLimitStore {
  return {
    async hit(key, windowMs) {
      try {
        const at = now();
        const rows = await db.$queryRaw<HitRow[]>`
          INSERT INTO "rate_limits" ("key", "count", "reset_at")
          VALUES (${key}, 1, to_timestamp(${(at + windowMs) / 1000}))
          ON CONFLICT ("key") DO UPDATE SET
            "count" = CASE WHEN "rate_limits"."reset_at" <= to_timestamp(${at / 1000}) THEN 1 ELSE "rate_limits"."count" + 1 END,
            "reset_at" = CASE WHEN "rate_limits"."reset_at" <= to_timestamp(${at / 1000}) THEN to_timestamp(${(at + windowMs) / 1000}) ELSE "rate_limits"."reset_at" END
          RETURNING "count", "reset_at"
        `;
        const row = rows[0];
        if (!row) throw new Error("rate_limit_hit_no_row");
        return { count: row.count, resetInMs: row.reset_at.getTime() - at };
      } catch (error) {
        log("warn", "rate_limit_store_failed", { op: "hit", error });
        return fallback.hit(key, windowMs);
      }
    },
    async current(key) {
      try {
        const at = now();
        const rows = await db.$queryRaw<HitRow[]>`
          SELECT "count", "reset_at" FROM "rate_limits"
          WHERE "key" = ${key} AND "reset_at" > to_timestamp(${at / 1000})
        `;
        const row = rows[0];
        if (!row) return { count: 0, resetInMs: 0 };
        return { count: row.count, resetInMs: row.reset_at.getTime() - at };
      } catch (error) {
        log("warn", "rate_limit_store_failed", { op: "current", error });
        return fallback.current(key);
      }
    },
    async reset(key) {
      try {
        await db.$executeRaw`DELETE FROM "rate_limits" WHERE "key" = ${key}`;
      } catch (error) {
        log("warn", "rate_limit_store_failed", { op: "reset", error });
        await fallback.reset(key);
      }
    }
  };
}

const memoryStore = createMemoryRateLimitStore();

// ponytail: baris expired dari key mati tetap tinggal; jalankan DELETE reset_at < now() berkala bila tabel membesar
export const rateLimitStore = createDbRateLimitStore(prisma, memoryStore);
