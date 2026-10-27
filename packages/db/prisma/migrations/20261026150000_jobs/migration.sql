-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "ref_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "run_after" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "locked_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "jobs_kind_ref_id_key" ON "jobs"("kind", "ref_id");

-- CreateIndex
CREATE INDEX "idx_jobs_queue" ON "jobs"("status", "run_after");
