import { Redis } from "@upstash/redis";
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

const HIT_SCRIPT = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end
return { count, redis.call('PTTL', KEYS[1]) }
`;

function createRedisRateLimitStore(redis: Redis, fallback: RateLimitStore): RateLimitStore {
  const prefix = "rl:";

  return {
    async hit(key, windowMs) {
      try {
        const [count, ttl] = await redis.eval<string[], [number, number]>(
          HIT_SCRIPT,
          [`${prefix}${key}`],
          [String(windowMs)]
        );
        return { count, resetInMs: ttl > 0 ? ttl : windowMs };
      } catch (error) {
        log("warn", "rate_limit_store_failed", { op: "hit", error });
        return fallback.hit(key, windowMs);
      }
    },
    async current(key) {
      try {
        const [count, ttl] = await Promise.all([
          redis.get<number>(`${prefix}${key}`),
          redis.pttl(`${prefix}${key}`)
        ]);
        if (ttl <= 0) return { count: 0, resetInMs: 0 };
        return { count: Number(count ?? 0), resetInMs: ttl };
      } catch (error) {
        log("warn", "rate_limit_store_failed", { op: "current", error });
        return fallback.current(key);
      }
    },
    async reset(key) {
      try {
        await redis.del(`${prefix}${key}`);
      } catch (error) {
        log("warn", "rate_limit_store_failed", { op: "reset", error });
        await fallback.reset(key);
      }
    }
  };
}

const memoryStore = createMemoryRateLimitStore();

function resolveRateLimitStore(): RateLimitStore {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    if (process.env.NODE_ENV === "production") {
      log("warn", "rate_limit_store_memory_only", {});
    }
    return memoryStore;
  }
  return createRedisRateLimitStore(new Redis({ url, token }), memoryStore);
}

export const rateLimitStore = resolveRateLimitStore();
