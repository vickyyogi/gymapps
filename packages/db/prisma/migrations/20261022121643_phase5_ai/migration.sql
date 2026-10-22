-- CreateTable
CREATE TABLE "prompt_versions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "template" TEXT NOT NULL,
    "parameters" JSONB NOT NULL DEFAULT '{}',
    "model" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prompt_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_generations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "program_id" TEXT,
    "type" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "prompt_version_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "input_hash" TEXT,
    "input_tokens" INTEGER NOT NULL DEFAULT 0,
    "output_tokens" INTEGER NOT NULL DEFAULT 0,
    "cost_usd" DECIMAL(10,6) NOT NULL DEFAULT 0,
    "latency_ms" INTEGER,
    "error_code" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "fallback_used" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(3),

    CONSTRAINT "ai_generations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_prompt_active" ON "prompt_versions"("name", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_prompt_name_version" ON "prompt_versions"("name", "version");

-- CreateIndex
CREATE UNIQUE INDEX "ai_generations_program_id_key" ON "ai_generations"("program_id");

-- CreateIndex
CREATE INDEX "idx_ai_gen_user_created" ON "ai_generations"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_ai_gen_type_created" ON "ai_generations"("type", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_ai_gen_status" ON "ai_generations"("status");

-- AddForeignKey
ALTER TABLE "ai_generations" ADD CONSTRAINT "ai_generations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_generations" ADD CONSTRAINT "ai_generations_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_generations" ADD CONSTRAINT "ai_generations_prompt_version_id_fkey" FOREIGN KEY ("prompt_version_id") REFERENCES "prompt_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
