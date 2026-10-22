import { LOGIN_RATE_LIMIT } from "@gymapps/shared";

type Bucket = { failures: number[]; resetAt: number };

// ponytail: in-memory per instance. Swap for Redis when running >1 instance (plan Fase 4).
const buckets = new Map<string, Bucket>();

function prune(now: number) {
  if (buckets.size < 10_000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.failures.at(-1)! <= now - LOGIN_RATE_LIMIT.windowMs) buckets.delete(key);
  }
}

export function checkLoginRateLimit(key: string, now = Date.now()) {
  prune(now);
  const bucket = buckets.get(key);
  if (!bucket) {
    return { allowed: true as const, remaining: LOGIN_RATE_LIMIT.maxFailures, resetAt: 0 };
  }

  bucket.failures = bucket.failures.filter((at) => at > now - LOGIN_RATE_LIMIT.windowMs);
  if (bucket.failures.length === 0) {
    buckets.delete(key);
    return {
      allowed: true as const,
      remaining: LOGIN_RATE_LIMIT.maxFailures,
      resetAt: 0
    };
  }

  if (bucket.failures.length < LOGIN_RATE_LIMIT.maxFailures) {
    return {
      allowed: true as const,
      remaining: LOGIN_RATE_LIMIT.maxFailures - bucket.failures.length,
      resetAt: bucket.failures[0]! + LOGIN_RATE_LIMIT.windowMs
    };
  }

  return { allowed: false as const, remaining: 0, resetAt: bucket.resetAt };
}

export function recordLoginFailure(key: string, now = Date.now()) {
  const bucket = buckets.get(key) ?? { failures: [], resetAt: 0 };
  bucket.failures = bucket.failures.filter((at) => at > now - LOGIN_RATE_LIMIT.windowMs);
  bucket.failures.push(now);
  bucket.resetAt = bucket.failures[0]! + LOGIN_RATE_LIMIT.windowMs;
  buckets.set(key, bucket);
}

export function clearLoginRateLimit(key: string) {
  buckets.delete(key);
}

export function loginRateLimitKey(ip: string, email: string) {
  return `${ip}:${email.trim().toLowerCase()}`;
}
