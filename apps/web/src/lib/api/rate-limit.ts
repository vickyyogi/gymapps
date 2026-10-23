import { ApiError } from "./errors";

export type RateLimitPolicy = { limit: number; windowMs: number };

type Entry = { hits: number[]; windowMs: number };

// ponytail: in-memory per instance, same as login. Swap for Redis when running >1 instance.
const entries = new Map<string, Entry>();

function prune(now: number) {
  if (entries.size < 10_000) return;
  for (const [key, entry] of entries) {
    if (entry.hits.at(-1)! <= now - entry.windowMs) entries.delete(key);
  }
}

export function consumeRateLimit(key: string, policy: RateLimitPolicy, now = Date.now()) {
  prune(now);
  const entry = entries.get(key) ?? { hits: [], windowMs: policy.windowMs };
  entry.hits = entry.hits.filter((at) => at > now - policy.windowMs);

  if (entry.hits.length >= policy.limit) {
    entries.set(key, entry);
    return { allowed: false as const, retryAfterMs: entry.hits[0]! + policy.windowMs - now };
  }

  entry.hits.push(now);
  entries.set(key, entry);
  return { allowed: true as const, retryAfterMs: 0 };
}

export function enforceRateLimit(scope: string, identity: string, policy: RateLimitPolicy) {
  const result = consumeRateLimit(`${scope}:${identity}`, policy);
  if (!result.allowed) {
    throw new ApiError(429, "RATE_LIMITED", "Too many requests", {
      headers: {
        "Retry-After": String(Math.max(1, Math.ceil(result.retryAfterMs / 1000)))
      }
    });
  }
}
