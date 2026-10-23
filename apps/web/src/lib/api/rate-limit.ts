import { ApiError } from "./errors";
import { rateLimitStore, type RateLimitStore } from "@/lib/rate-limit-store";

export type RateLimitPolicy = { limit: number; windowMs: number };

export async function consumeRateLimit(
  key: string,
  policy: RateLimitPolicy,
  store: RateLimitStore = rateLimitStore
) {
  const { count, resetInMs } = await store.hit(key, policy.windowMs);
  if (count > policy.limit) {
    return { allowed: false as const, retryAfterMs: resetInMs };
  }
  return { allowed: true as const, retryAfterMs: 0 };
}

export async function enforceRateLimit(scope: string, identity: string, policy: RateLimitPolicy) {
  const result = await consumeRateLimit(`${scope}:${identity}`, policy);
  if (!result.allowed) {
    throw new ApiError(429, "RATE_LIMITED", "Too many requests", {
      headers: {
        "Retry-After": String(Math.max(1, Math.ceil(result.retryAfterMs / 1000)))
      }
    });
  }
}
