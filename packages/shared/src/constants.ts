export const LOCALES = ["id", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "id";

export const SESSION_COOKIE_NAME = "gymapps_session";
export const SESSION_TTL_SECONDS = 2_592_000; // 30 days, FR-01-03
export const SESSION_TTL_MS = SESSION_TTL_SECONDS * 1000;

export const LOGIN_RATE_LIMIT = {
  maxFailures: 5,
  windowMs: 15 * 60 * 1000
} as const;

const HOUR_MS = 60 * 60 * 1000;

export const API_RATE_LIMITS = {
  register: { limit: 30, windowMs: HOUR_MS }, // per IP
  exportCreate: { limit: 10, windowMs: HOUR_MS }, // per user, PDF/CSV jobs
  reportCreate: { limit: 10, windowMs: HOUR_MS }, // per user, PDF jobs
  coachThreadCreate: { limit: 20, windowMs: HOUR_MS }, // per user
  coachFeedback: { limit: 60, windowMs: 60 * 1000 }, // per user
  passwordChange: { limit: 10, windowMs: HOUR_MS }, // per user
  accountDelete: { limit: 5, windowMs: HOUR_MS } // per user
} as const;

export const ARGON2_OPTIONS = {
  memoryCost: 65_536, // KiB = 64 MB
  timeCost: 3,
  parallelism: 1
} as const;
