-- CreateIndex
CREATE INDEX "idx_pr_user_achieved" ON "personal_records"("user_id", "achieved_at" DESC);

-- CreateIndex
CREATE INDEX "idx_program_sessions_completed" ON "program_sessions"("program_id", "completed_at");
