export type QuotaLimits = {
  perMinute?: number;
  perHour?: number;
  perDay?: number;
};

export type QuotaRemaining = {
  minute?: number;
  hour?: number;
  day?: number;
};

export type QuotaResult = {
  allowed: boolean;
  blockedBy?: "minute" | "hour" | "day";
  retryAfterSeconds: number;
  remaining: QuotaRemaining;
};

/**
 * Pure sliding-window check. Caller supplies usage timestamps (ms) and limits,
 * e.g. generate: { perMinute: 20, perDay: 5 }, chat: { perHour: 30, perDay: 200 }.
 */
export function checkQuota(
  usageTimestamps: number[],
  limits: QuotaLimits,
  now = Date.now()
): QuotaResult {
  const checks = [
    { window: "minute" as const, limit: limits.perMinute, size: 60_000 },
    { window: "hour" as const, limit: limits.perHour, size: 60 * 60_000 },
    { window: "day" as const, limit: limits.perDay, size: 24 * 60 * 60_000 }
  ];

  const remaining: QuotaRemaining = {};
  let retryAfterSeconds = 0;
  let blockedBy: QuotaResult["blockedBy"];

  for (const check of checks) {
    if (check.limit === undefined) continue;

    const inWindow = usageTimestamps.filter(
      (timestamp) => timestamp > now - check.size && timestamp <= now
    );
    remaining[check.window] = Math.max(0, check.limit - inWindow.length);

    if (inWindow.length >= check.limit) {
      blockedBy ??= check.window;
      const oldest = Math.min(...inWindow);
      retryAfterSeconds = Math.max(
        retryAfterSeconds,
        Math.ceil((oldest + check.size - now) / 1000)
      );
    }
  }

  return {
    allowed: blockedBy === undefined,
    ...(blockedBy ? { blockedBy } : {}),
    retryAfterSeconds,
    remaining
  };
}
