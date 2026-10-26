import "server-only";

import { prisma } from "@gymapps/db";
import { captureError, track } from "@/lib/analytics";
import { runExport } from "@/lib/ai/exports";
import { runProgramGeneration } from "@/lib/ai/orchestrator";
import { runReport } from "@/lib/ai/reports";
import { newId } from "@/lib/id";
import { log } from "@/lib/log";

const HANDLERS = {
  program_generation: runProgramGeneration,
  export: runExport,
  report: runReport
} satisfies Record<string, (refId: string) => Promise<void>>;

export type JobKind = keyof typeof HANDLERS;

const POLL_MS = 2000;
const MAX_ATTEMPTS = 3;
const STALE_MS = 5 * 60_000;

let lastPollErrorAt = 0;

type Claimed = { id: string; kind: string; ref_id: string; attempts: number };

/**
 * Queues one unit of work. Duplicate requests for the same row are ignored:
 * the runners are idempotent and already return early on finished rows.
 */
export async function enqueue(kind: JobKind, refId: string) {
  await prisma.job.createMany({
    data: [{ id: newId("job"), kind, refId }],
    skipDuplicates: true
  });
  kick();
}

/** Runs queued jobs in this process. Safe to call more than once. */
export function startWorker() {
  const state = globalThis as { __gymappsJobs?: NodeJS.Timeout };
  if (state.__gymappsJobs) return;
  state.__gymappsJobs = setInterval(() => void tick(), POLL_MS);
  state.__gymappsJobs.unref?.();
  kick();
}

function kick() {
  void tick();
}

let busy = false;

async function tick() {
  if (busy) return;
  busy = true;
  try {
    // A crashed process leaves rows locked; put them back after the lease expires.
    await prisma.job.updateMany({
      where: { status: "running", lockedAt: { lt: new Date(Date.now() - STALE_MS) } },
      data: { status: "queued", lockedAt: null }
    });
    for (;;) {
      const [job] = await prisma.$queryRaw<Claimed[]>`
        UPDATE jobs
        SET status = 'running', locked_at = now(), attempts = attempts + 1
        WHERE id = (
          SELECT id FROM jobs
          WHERE status = 'queued' AND run_after <= now()
          ORDER BY created_at
          LIMIT 1
          FOR UPDATE SKIP LOCKED
        )
        RETURNING id, kind, ref_id, attempts
      `;
      if (!job) return;
      await run(job);
    }
  } catch (error) {
    // Postgres down would otherwise log every poll tick.
    if (Date.now() - lastPollErrorAt > 60_000) {
      lastPollErrorAt = Date.now();
      log("error", "jobs_poll_failed", { error });
    }
  } finally {
    busy = false;
  }
}

async function run(job: Claimed) {
  try {
    const handler = HANDLERS[job.kind as JobKind];
    if (!handler) throw new Error(`unknown_job_kind:${job.kind}`);
    await handler(job.ref_id);
    await prisma.job.update({
      where: { id: job.id },
      data: { status: "done", error: null, lockedAt: null }
    });
  } catch (error) {
    const retry = job.attempts < MAX_ATTEMPTS;
    await prisma.job.update({
      where: { id: job.id },
      data: {
        status: retry ? "queued" : "failed",
        error: (error instanceof Error ? error.message : String(error)).slice(0, 500),
        runAfter: new Date(Date.now() + job.attempts * 30_000),
        lockedAt: null
      }
    });
    captureError(error, { kind: job.kind, attempts: job.attempts, source: "jobs" });
    track("job_failed", null, { kind: job.kind, attempts: job.attempts, retry });
    log("error", "job_failed", {
      job_id: job.id,
      kind: job.kind,
      attempts: job.attempts,
      retry,
      error
    });
  }
}
