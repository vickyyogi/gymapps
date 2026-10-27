// Background work is queued in the Postgres `jobs` table and drained by the
// in-process worker in apps/web/src/lib/jobs.ts. No external queue service yet.
export {};
