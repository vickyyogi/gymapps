import { LOGIN_RATE_LIMIT } from "@gymapps/shared";
import { rateLimitStore, type RateLimitStore } from "@/lib/rate-limit-store";

const scopedKey = (key: string) => `login:${key}`;

export async function checkLoginRateLimit(
  key: string,
  store: RateLimitStore = rateLimitStore
) {
  const { count, resetInMs } = await store.current(scopedKey(key));
  if (count < LOGIN_RATE_LIMIT.maxFailures) {
    return {
      allowed: true as const,
      remaining: LOGIN_RATE_LIMIT.maxFailures - count,
      resetAt: resetInMs > 0 ? Date.now() + resetInMs : 0
    };
  }
  return { allowed: false as const, remaining: 0, resetAt: Date.now() + resetInMs };
}

export async function recordLoginFailure(key: string, store: RateLimitStore = rateLimitStore) {
  await store.hit(scopedKey(key), LOGIN_RATE_LIMIT.windowMs);
}

export async function clearLoginRateLimit(key: string, store: RateLimitStore = rateLimitStore) {
  await store.reset(scopedKey(key));
}

export function loginRateLimitKey(ip: string, email: string) {
  return `${ip}:${email.trim().toLowerCase()}`;
}
