-- CreateTable
CREATE TABLE "exercises" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name_id" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "description_id" TEXT,
    "description_en" TEXT,
    "instructions_id" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "instructions_en" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "primary_muscle" "muscle_group" NOT NULL,
    "secondary_muscles" "muscle_group"[] DEFAULT ARRAY[]::"muscle_group"[],
    "equipment" "equipment_type"[] DEFAULT ARRAY[]::"equipment_type"[],
    "difficulty" TEXT NOT NULL DEFAULT 'intermediate',
    "movement_pattern" TEXT,
    "impact_level" TEXT NOT NULL DEFAULT 'low',
    "contraindicated_areas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_compound" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'published',
    "source" TEXT NOT NULL DEFAULT 'seed',
    "owner_user_id" TEXT,
    "review_notes" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "source" TEXT NOT NULL DEFAULT 'manual',
    "goal" TEXT,
    "split_type" TEXT NOT NULL,
    "duration_weeks" INTEGER NOT NULL,
    "days_per_week" INTEGER NOT NULL,
    "session_minutes" INTEGER NOT NULL DEFAULT 60,
    "start_date" DATE,
    "progression_type" TEXT NOT NULL DEFAULT 'double_progression',
    "ai_generated" BOOLEAN NOT NULL DEFAULT false,
    "ai_rationale" JSONB,
    "is_stale" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_weeks" (
    "id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "week_number" INTEGER NOT NULL,
    "focus_note" TEXT,
    "is_deload" BOOLEAN NOT NULL DEFAULT false,
    "volume_multiplier" DECIMAL(4,2) NOT NULL DEFAULT 1,

    CONSTRAINT "program_weeks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_sessions" (
    "id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "program_week_id" TEXT NOT NULL,
    "day_index" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "estimated_minutes" INTEGER,
    "completed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "program_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_exercises" (
    "id" TEXT NOT NULL,
    "program_session_id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "target_sets" INTEGER NOT NULL DEFAULT 3,
    "target_reps_min" INTEGER NOT NULL DEFAULT 8,
    "target_reps_max" INTEGER NOT NULL DEFAULT 12,
    "target_rpe" DECIMAL(2,1),
    "rest_seconds" INTEGER NOT NULL DEFAULT 90,
    "tempo" TEXT,
    "is_warmup" BOOLEAN NOT NULL DEFAULT false,
    "superset_group" INTEGER,
    "notes" TEXT,
    "progression" JSONB,
    "ai_generated" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "program_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workouts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "program_id" TEXT,
    "program_session_id" TEXT,
    "template_id" TEXT,
    "title" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "started_at" TIMESTAMPTZ(3) NOT NULL,
    "ended_at" TIMESTAMPTZ(3),
    "duration_seconds" INTEGER,
    "notes" TEXT,
    "bodyweight_kg" DECIMAL(5,1),
    "session_rpe" DECIMAL(2,1),
    "total_volume_kg" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_sets" INTEGER NOT NULL DEFAULT 0,
    "total_reps" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "workouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_exercises" (
    "id" TEXT NOT NULL,
    "workout_id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "notes" TEXT,
    "superset_group" INTEGER,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workout_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_sets" (
    "id" TEXT NOT NULL,
    "workout_exercise_id" TEXT NOT NULL,
    "workout_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "set_number" INTEGER NOT NULL,
    "weight_kg" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "reps" INTEGER NOT NULL DEFAULT 0,
    "rpe" DECIMAL(2,1),
    "is_warmup" BOOLEAN NOT NULL DEFAULT false,
    "is_completed" BOOLEAN NOT NULL DEFAULT true,
    "is_pr" BOOLEAN NOT NULL DEFAULT false,
    "est_1rm_kg" DECIMAL(6,2),
    "volume_kg" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "duration_seconds" INTEGER,
    "distance_km" DECIMAL(8,3),
    "avg_heart_rate" INTEGER,
    "calories" INTEGER,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "workout_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personal_records" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "record_type" TEXT NOT NULL,
    "value" DECIMAL(8,2) NOT NULL,
    "reps" INTEGER,
    "weight_kg" DECIMAL(6,2),
    "achieved_at" TIMESTAMPTZ(3) NOT NULL,
    "workout_set_id" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "personal_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idempotency_keys" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "status_code" INTEGER NOT NULL,
    "response" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "exercises_slug_key" ON "exercises"("slug");

-- CreateIndex
CREATE INDEX "idx_exercises_primary_muscle" ON "exercises"("primary_muscle");

-- CreateIndex
CREATE INDEX "idx_exercises_status_source" ON "exercises"("status", "source");

-- CreateIndex
CREATE INDEX "idx_exercises_owner" ON "exercises"("owner_user_id");

-- CreateIndex
CREATE INDEX "idx_programs_user_status" ON "programs"("user_id", "status");

-- CreateIndex
CREATE INDEX "idx_programs_user_created" ON "programs"("user_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "uniq_program_week" ON "program_weeks"("program_id", "week_number");

-- CreateIndex
CREATE INDEX "idx_program_sessions_program" ON "program_sessions"("program_id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_program_session_day" ON "program_sessions"("program_id", "program_week_id", "day_index");

-- CreateIndex
CREATE INDEX "idx_program_exercises_exercise" ON "program_exercises"("exercise_id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_program_exercise_position" ON "program_exercises"("program_session_id", "position");

-- CreateIndex
CREATE INDEX "idx_workouts_user_started" ON "workouts"("user_id", "started_at" DESC);

-- CreateIndex
CREATE INDEX "idx_workouts_user_status" ON "workouts"("user_id", "status");

-- CreateIndex
CREATE INDEX "idx_workouts_program_session" ON "workouts"("program_session_id");

-- CreateIndex
CREATE INDEX "idx_workout_exercises_exercise" ON "workout_exercises"("exercise_id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_workout_exercise_position" ON "workout_exercises"("workout_id", "position");

-- CreateIndex
CREATE INDEX "idx_sets_workout" ON "workout_sets"("workout_id");

-- CreateIndex
CREATE INDEX "idx_sets_user_exercise_date" ON "workout_sets"("user_id", "exercise_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_sets_user_created" ON "workout_sets"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_sets_pr" ON "workout_sets"("is_pr");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_workout_set_number" ON "workout_sets"("workout_exercise_id", "set_number");

-- CreateIndex
CREATE INDEX "idx_pr_user_exercise" ON "personal_records"("user_id", "exercise_id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_pr_user_exercise_type_time" ON "personal_records"("user_id", "exercise_id", "record_type", "achieved_at");

-- CreateIndex
CREATE INDEX "idx_idempotency_created" ON "idempotency_keys"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_idempotency_user_key" ON "idempotency_keys"("user_id", "key");

-- AddForeignKey
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programs" ADD CONSTRAINT "programs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_weeks" ADD CONSTRAINT "program_weeks_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_sessions" ADD CONSTRAINT "program_sessions_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_sessions" ADD CONSTRAINT "program_sessions_program_week_id_fkey" FOREIGN KEY ("program_week_id") REFERENCES "program_weeks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_exercises" ADD CONSTRAINT "program_exercises_program_session_id_fkey" FOREIGN KEY ("program_session_id") REFERENCES "program_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_exercises" ADD CONSTRAINT "program_exercises_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workouts" ADD CONSTRAINT "workouts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workouts" ADD CONSTRAINT "workouts_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workouts" ADD CONSTRAINT "workouts_program_session_id_fkey" FOREIGN KEY ("program_session_id") REFERENCES "program_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_exercises" ADD CONSTRAINT "workout_exercises_workout_id_fkey" FOREIGN KEY ("workout_id") REFERENCES "workouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_exercises" ADD CONSTRAINT "workout_exercises_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_sets" ADD CONSTRAINT "workout_sets_workout_exercise_id_fkey" FOREIGN KEY ("workout_exercise_id") REFERENCES "workout_exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_sets" ADD CONSTRAINT "workout_sets_workout_id_fkey" FOREIGN KEY ("workout_id") REFERENCES "workouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_sets" ADD CONSTRAINT "workout_sets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_sets" ADD CONSTRAINT "workout_sets_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_records" ADD CONSTRAINT "personal_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_records" ADD CONSTRAINT "personal_records_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_records" ADD CONSTRAINT "personal_records_workout_set_id_fkey" FOREIGN KEY ("workout_set_id") REFERENCES "workout_sets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idempotency_keys" ADD CONSTRAINT "idempotency_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Phase 3 invariants that Prisma schema cannot express.
CREATE UNIQUE INDEX "uniq_active_program" ON "programs"("user_id")
  WHERE "status" = 'active' AND "deleted_at" IS NULL;

ALTER TABLE "exercises"
  ADD CONSTRAINT "chk_exercises_custom_owner"
  CHECK ("source" <> 'custom' OR "owner_user_id" IS NOT NULL);

ALTER TABLE "workout_sets"
  ADD CONSTRAINT "chk_sets_non_negative"
  CHECK ("reps" >= 0 AND "reps" <= 500 AND "weight_kg" >= 0);

ALTER TABLE "personal_records"
  ADD CONSTRAINT "chk_pr_record_type"
  CHECK ("record_type" IN ('max_weight', 'max_reps', 'max_volume', 'est_1rm'));
