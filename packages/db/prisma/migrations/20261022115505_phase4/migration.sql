-- CreateTable
CREATE TABLE "user_profiles" (
    "user_id" TEXT NOT NULL,
    "goals" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "experience_level" TEXT,
    "days_per_week" INTEGER,
    "session_minutes" INTEGER,
    "equipment" "equipment_type"[] DEFAULT ARRAY[]::"equipment_type"[],
    "injury_areas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "injury_notes" TEXT,
    "preferred_split" TEXT,
    "preferred_cardio" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "height_cm" DECIMAL(5,1),
    "birth_date" DATE,
    "sex" TEXT,
    "program_style_notes" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "body_metrics" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "recorded_on" DATE NOT NULL,
    "weight_kg" DECIMAL(5,1),
    "body_fat_pct" DECIMAL(4,1),
    "chest_cm" DECIMAL(5,1),
    "waist_cm" DECIMAL(5,1),
    "hip_cm" DECIMAL(5,1),
    "arm_cm" DECIMAL(5,1),
    "thigh_cm" DECIMAL(5,1),
    "calf_cm" DECIMAL(5,1),
    "shoulder_cm" DECIMAL(5,1),
    "photo_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "body_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "workout_id" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "body" TEXT NOT NULL,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_body_metrics_user_date" ON "body_metrics"("user_id", "recorded_on" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "uniq_body_metric_user_date" ON "body_metrics"("user_id", "recorded_on");

-- CreateIndex
CREATE INDEX "idx_notes_user_created" ON "notes"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_notes_user_category" ON "notes"("user_id", "category");

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "body_metrics" ADD CONSTRAINT "body_metrics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_workout_id_fkey" FOREIGN KEY ("workout_id") REFERENCES "workouts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
