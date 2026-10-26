import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

// Real Postgres check: queue survives process restarts and stale locks are retried.
describe.skipIf(!process.env.DATABASE_URL)("job queue", () => {
  async function waitFor(status: string, refId: string) {
    const { prisma } = await import("@gymapps/db");
    for (let i = 0; i < 50; i += 1) {
      const row = await prisma.job.findUnique({
        where: { kind_refId: { kind: "export", refId } }
      });
      if (row?.status === status) return row;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error(`job ${refId} never reached ${status}`);
  }

  it("runs a queued job once and ignores duplicate enqueues", async () => {
    const { prisma } = await import("@gymapps/db");
    const { enqueue } = await import("@/lib/jobs");
    const refId = "exp_missing_for_jobs_test";
    await prisma.job.deleteMany({ where: { kind: "export", refId } });

    await Promise.all([enqueue("export", refId), enqueue("export", refId)]);
    const row = await waitFor("done", refId);
    expect(row.attempts).toBe(1);
    expect(row.lockedAt).toBeNull();
    expect(await prisma.job.count({ where: { kind: "export", refId } })).toBe(1);

    await prisma.job.deleteMany({ where: { kind: "export", refId } });
  });

  it("reclaims jobs left running by a crashed process", async () => {
    const { prisma } = await import("@gymapps/db");
    const { enqueue } = await import("@/lib/jobs");
    const refId = "exp_stale_lock_for_jobs_test";
    await prisma.job.deleteMany({ where: { kind: "export", refId } });

    await prisma.job.create({
      data: {
        id: "job_stale_lock_test",
        kind: "export",
        refId,
        status: "running",
        attempts: 1,
        lockedAt: new Date(Date.now() - 10 * 60_000)
      }
    });

    await enqueue("export", refId);
    const row = await waitFor("done", refId);
    expect(row.attempts).toBe(2);

    await prisma.job.deleteMany({ where: { kind: "export", refId } });
  });
});
