# Graph Report - gymapps  (2026-10-23)

## Corpus Check
- 211 files · ~117,190 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: .example 3, (none) 1, .webmanifest 1)

## Summary
- 1560 nodes · 3329 edges · 103 communities (97 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9930d987`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- handler.ts
- chat.ts
- web/package.json
- recommendations.ts
- scripts
- orchestrator.ts
- validator.ts
- next-intl
- phase6-validation.ts
- session.ts
- AI Prompt Specification — GymApps v1
- ApiError
- exports.ts
- db/package.json
- analytics.ts
- register/route.ts
- context.ts
- workouts/route.ts
- fallback-generator.ts
- shared/src/index.ts
- parseQuery
- onboarding-wizard.tsx
- newId
- login/route.ts
- serializers.ts
- programs-list.tsx
- sets/route.ts
- program-builder.tsx
- shared/package.json
- workout-logger.tsx
- phase3-validation.ts
- domain.test.ts
- phase8-backup.mjs
- 5. Epics, User Stories & Prioritas
- phase5-e2e.mjs
- reports.ts
- react
- ProgressTracker
- domain/package.json
- phase7-e2e.mjs
- compilerOptions
- parseJson
- CoachChat
- phase6-e2e.mjs
- phase8-load.mjs
- body-metrics/route.ts
- 4. Program & Latihan
- seed.ts
- phase4-validation.ts
- log
- getSession
- dashboard-overview.tsx
- compilerOptions
- pr.ts
- Phase 1 (Fondasi)
- ExportsPanel
- Product Requirements Document — GymApps v1.0 (Beta)
- jobs/package.json
- [locale]/layout.tsx
- ADR-001 — Bentuk Program AI (Q-02)
- ADR-002 — Kapan Program Dianggap Stale (Q-06)
- ADR-003 — Retry Anthropic Sebelum Fallback (Q-08)
- ADR-004 — Data User Terhapus pada Statistik Agregat (Q-10)
- 3. Fase
- exercise-library.tsx
- Data Model — GymApps v1
- 6. Tabel Pendukung
- 10. Non-Functional Requirements
- 9. Spesifikasi AI
- @prisma/client
- phase3-e2e.mjs
- workouts-list.tsx
- Fase 8 — Hardening & Beta
- 3.1 Persona
- 6. Arsitektur Teknis
- profile/route.ts
- 5. Tabel AI
- 3. Tabel Inti
- Rencana Implementasi GymApps v1
- [bodyMetricId]/route.ts
- Dokumentasi GymApps
- db/tsconfig.json
- openapi.d.ts
- shared/tsconfig.json
- mock-chat-ai.mjs
- one-rm/route.ts
- personal-records/route.ts
- 14. Roadmap
- 1. Ringkasan Eksekutif / Executive Summary
- 8. Spesifikasi API
- Lampiran B — Deskripsi Wireframe (Low-fidelity)
- 12. Analytics, Funnel & KPIs
- 13. Monetisasi (Rencana, Implementasi v1.2)
- 4. Competitive Landscape & Positioning
- 7. Model Data
- domain/tsconfig.json
- jobs/tsconfig.json
- postcss.config.mjs
- sw.js

## God Nodes (most connected - your core abstractions)
1. `ApiError` - 87 edges
2. `next` - 80 edges
3. `parseJson()` - 63 edges
4. `prisma` - 57 edges
5. `withAuthApi()` - 56 edges
6. `newId()` - 53 edges
7. `parseQuery()` - 36 edges
8. `next-intl` - 33 edges
9. `clientIp()` - 25 edges
10. `react` - 22 edges

## Surprising Connections (you probably didn't know these)
- `Index review query panas` --references--> `analyticsVolume()`  [INFERRED]
  docs/phase8-hardening.md → apps/web/src/lib/api/analytics.ts
- `12.1 Daftar Event (PostHog)` --references--> `valid()`  [INFERRED]
  docs/PRD.md → packages/domain/src/stats/one-rm.ts
- `EP-05 — Cardio Logging (Prioritas: Should)` --references--> `run()`  [INFERRED]
  docs/PRD.md → scripts/phase8-e2e.mjs
- `3.4 `exercises` — Katalog Gerakan` --references--> `seed()`  [INFERRED]
  docs/data-model.md → scripts/phase8-load.mjs
- `5.4 `chat_messages`` --references--> `feedback()`  [INFERRED]
  docs/data-model.md → apps/web/src/components/phase6/coach-chat.tsx

## Import Cycles
- None detected.

## Communities (103 total, 6 thin omitted)

### Community 0 - "handler.ts"
Cohesion: 0.07
Nodes (39): runtime, DELETE, ownedThread(), runtime, runtime, runtime, runtime, runtime (+31 more)

### Community 1 - "chat.ts"
Cohesion: 0.06
Nodes (52): ownedThread(), POST, runtime, streamResponse(), buildChatContext(), CHAT_MAX_CONTEXT_TOKENS, ChatCard, ChatCitation (+44 more)

### Community 2 - "web/package.json"
Cohesion: 0.05
Nodes (43): dependencies, @gymapps/db, @gymapps/domain, @gymapps/shared, next, next-intl, @node-rs/argon2, playwright-core (+35 more)

### Community 3 - "recommendations.ts"
Cohesion: 0.08
Nodes (27): Candidate, candidatesFor(), evaluateRecommendationsForUser(), isoDate(), narrate(), PULL, PUSH, SEVERITY_ORDER (+19 more)

### Community 4 - "scripts"
Cohesion: 0.05
Nodes (36): compat, config, devDependencies, eslint, eslint-config-next, @eslint/eslintrc, typescript, engines (+28 more)

### Community 5 - "orchestrator.ts"
Cohesion: 0.08
Nodes (25): GET, asMetadata(), completenessIssues(), failJob(), GOAL_LABEL, JobMetadata, jobResponse(), JobState (+17 more)

### Community 6 - "validator.ts"
Cohesion: 0.11
Nodes (31): Program, ProgramExercise, ProgramSession, ProgramWeek, ProgressionType, SplitType, ValidationContext, ValidationIssue (+23 more)

### Community 7 - "next-intl"
Cohesion: 0.12
Nodes (17): nextConfig, withNextIntl, dynamic, RecommendationsPage(), LoginPage(), RegisterPage(), LoginForm(), RegisterForm() (+9 more)

### Community 8 - "phase6-validation.ts"
Cohesion: 0.08
Nodes (20): GET, runtime, SEVERITY_ORDER, PATCH, runtime, GET, runtime, serializeMessage() (+12 more)

### Community 9 - "session.ts"
Cohesion: 0.11
Nodes (19): POST, runtime, POST, runtime, attachSessionCookie(), clearSessionCookie(), cookieOptions(), ActiveSession (+11 more)

### Community 10 - "AI Prompt Specification — GymApps v1"
Cohesion: 0.06
Nodes (31): 10.1 Kasus Otomatis (CI, 20 kasus), 10.2 Kasus Manual (50 kasus, review mingguan), 10.3 Red-Team Set (30 prompt, wajib 0 violation), 10. Eval Set, 11. Monitoring & Biaya, 12. Fallback & Kill-Switch, 1. Prinsip, 2. Model & Konfigurasi (+23 more)

### Community 11 - "ApiError"
Cohesion: 0.18
Nodes (21): DELETE, POST, runtime, POST, runtime, DELETE, PATCH, runtime (+13 more)

### Community 12 - "exports.ts"
Cohesion: 0.13
Nodes (25): DELETE, GET, ownedExport(), runtime, GET, POST, runtime, GET (+17 more)

### Community 13 - "db/package.json"
Cohesion: 0.07
Nodes (28): dependencies, @prisma/client, ulid, devDependencies, prisma, tsx, @types/node, typescript (+20 more)

### Community 14 - "analytics.ts"
Cohesion: 0.13
Nodes (21): GET, GET, GET, GET, runtime, analyticsAdherence(), analyticsCalendar(), analyticsMuscleBalance() (+13 more)

### Community 15 - "register/route.ts"
Cohesion: 0.12
Nodes (14): POST, runtime, POST, runtime, feedbackSchema, consumeRateLimit(), enforceRateLimit(), entries (+6 more)

### Community 16 - "context.ts"
Cohesion: 0.10
Nodes (17): runtime, STEPS, BODY_AREAS, bodyArea(), buildProgramContext(), ContextArrayKey, fitContext(), hashContext() (+9 more)

### Community 17 - "workouts/route.ts"
Cohesion: 0.19
Nodes (21): DELETE, POST, runtime, POST, runtime, DELETE, detail(), GET (+13 more)

### Community 18 - "fallback-generator.ts"
Cohesion: 0.12
Nodes (20): BALANCE_MUSCLES, balanceWeek(), broPlans(), DayPlan, estimatedSeconds(), estimateSecond(), ExerciseMetaMap, FULL_BODY_MUSCLES (+12 more)

### Community 19 - "shared/src/index.ts"
Cohesion: 0.11
Nodes (17): email, LoginInput, LoginRequest, loginSchema, newPassword, RegisterInput, RegisterRequest, registerSchema (+9 more)

### Community 20 - "parseQuery"
Cohesion: 0.21
Nodes (19): GET, POST, runtime, GET, GET, GET, POST, runtime (+11 more)

### Community 21 - "onboarding-wizard.tsx"
Cohesion: 0.13
Nodes (16): AuthLayout(), dynamic, OnboardingPage(), LocaleSwitcher(), ClassNames(), EQUIPMENT, Form, GOALS (+8 more)

### Community 22 - "newId"
Cohesion: 0.17
Nodes (19): PATCH, GET, POST, runtime, PATCH, POST, runtime, POST (+11 more)

### Community 23 - "login/route.ts"
Cohesion: 0.18
Nodes (16): POST, runtime, GET, runtime, rateLimitHeaders(), Bucket, buckets, checkLoginRateLimit() (+8 more)

### Community 24 - "serializers.ts"
Cohesion: 0.13
Nodes (14): GET, runtime, GET, programInputSchema, iso(), nullableNumber(), numberValue(), PreviousPerformance (+6 more)

### Community 25 - "programs-list.tsx"
Cohesion: 0.12
Nodes (17): dynamic, ProgramsPage(), GOALS, Program, ProgramsList(), activate(), archive(), load() (+9 more)

### Community 26 - "sets/route.ts"
Cohesion: 0.22
Nodes (15): POST, runtime, DELETE, PATCH, runtime, idempotencyKeyFrom(), savedIdempotentResponse(), saveIdempotentResponse() (+7 more)

### Community 27 - "program-builder.tsx"
Cohesion: 0.13
Nodes (11): dynamic, ProgramPage(), EQUIPMENT, ExercisePicker(), MUSCLES, PickedExercise, Program, ProgramBuilder() (+3 more)

### Community 28 - "shared/package.json"
Cohesion: 0.11
Nodes (17): dependencies, zod, devDependencies, openapi-typescript, typescript, typescript, zod, main (+9 more)

### Community 29 - "workout-logger.tsx"
Cohesion: 0.17
Nodes (10): dynamic, WorkoutPage(), deltaLabel(), ExerciseCard(), fmt(), PreviousPerformance, Workout, WorkoutExercise (+2 more)

### Community 30 - "phase3-validation.ts"
Cohesion: 0.12
Nodes (15): boolParam, cursor, DIFFICULTY, EQUIPMENT, muscle, MUSCLES, programExerciseSchema, programListSchema (+7 more)

### Community 31 - "domain.test.ts"
Cohesion: 0.14
Nodes (6): 8. Post-Processing & Moderasi, BIG_MUSCLES, catalog(), context(), generated(), input()

### Community 32 - "phase8-backup.mjs"
Cohesion: 0.17
Nodes (12): compose, counts(), docker(), main(), prisma, root, buildId, main() (+4 more)

### Community 33 - "5. Epics, User Stories & Prioritas"
Cohesion: 0.12
Nodes (16): 5.1 Ringkasan Epik, 5. Epics, User Stories & Prioritas, EP-01 — Authentication & Account, EP-02 — Onboarding & User Profile, EP-03 — Exercise Library, EP-04 — Workout Logging (Strength), EP-05 — Cardio Logging (Prioritas: Should), EP-06 — Manual Program Builder & Templates (+8 more)

### Community 34 - "phase5-e2e.mjs"
Cohesion: 0.26
Nodes (15): assertBodyweightKneeSafe(), assertSessionCount(), call(), children, generate(), main(), ok(), prisma (+7 more)

### Community 35 - "reports.ts"
Cohesion: 0.24
Nodes (11): maxDuration, POST, runtime, chartSvg(), createReportJob(), escapeHtml(), exportDir(), isoDate() (+3 more)

### Community 36 - "react"
Cohesion: 0.23
Nodes (10): AppLayout(), dynamic, LogoutButton(), Notification, NotificationBell(), load(), openNotification(), readAll() (+2 more)

### Community 37 - "ProgressTracker"
Cohesion: 0.17
Nodes (8): dynamic, ProgressPage(), BodyMetric, CATEGORIES, fmt(), Note, ProgressTracker(), today()

### Community 38 - "domain/package.json"
Cohesion: 0.13
Nodes (14): devDependencies, typescript, vitest, typescript, vitest, main, name, private (+6 more)

### Community 39 - "phase7-e2e.mjs"
Cohesion: 0.26
Nodes (14): call(), children, download(), main(), ok(), poll(), prisma, register() (+6 more)

### Community 40 - "compilerOptions"
Cohesion: 0.13
Nodes (14): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, lib, module, moduleResolution, noEmit (+6 more)

### Community 41 - "parseJson"
Cohesion: 0.20
Nodes (12): POST, POST, runtime, PATCH, DELETE, owned(), PATCH, POST (+4 more)

### Community 42 - "CoachChat"
Cohesion: 0.16
Nodes (7): CoachPage(), dynamic, Card, Citation, CoachChat(), Message, Thread

### Community 43 - "phase6-e2e.mjs"
Cohesion: 0.26
Nodes (13): call(), children, createProgram(), main(), ok(), prisma, readSse(), register() (+5 more)

### Community 44 - "phase8-load.mjs"
Cohesion: 0.25
Nodes (13): call(), main(), measure(), worker(), opsMetrics(), percentile(), prisma, register() (+5 more)

### Community 45 - "body-metrics/route.ts"
Cohesion: 0.21
Nodes (7): GET, POST, runtime, num(), serializeBodyMetric(), bodyMetricListSchema, bodyMetricSchema

### Community 46 - "4. Program & Latihan"
Cohesion: 0.15
Nodes (13): 4.10 `notes`, 4.11 `workout_templates`, 4.12 `workout_template_exercises`, 4.1 `programs`, 4.2 `program_weeks`, 4.3 `program_sessions`, 4.4 `program_exercises`, 4.5 `workouts` — Sesi Tercatat (+5 more)

### Community 47 - "seed.ts"
Cohesion: 0.18
Nodes (12): buildExercises(), equipment, EquipmentCode, equipmentLabel, main(), Movement, movements, muscles (+4 more)

### Community 48 - "phase4-validation.ts"
Cohesion: 0.18
Nodes (10): GET, runtime, analyticsVolumeSchema, EQUIPMENT, GOALS, INJURY_AREAS, noteListSchema, noteSchema (+2 more)

### Community 49 - "log"
Cohesion: 0.26
Nodes (9): GET, runtime, failure(), requestIdFor(), withApi(), requireSession(), Level, log() (+1 more)

### Community 50 - "getSession"
Cohesion: 0.26
Nodes (10): AdminExercisesPage(), dynamic, AdminExerciseEditor(), load(), save(), select(), Exercise, formFrom() (+2 more)

### Community 51 - "dashboard-overview.tsx"
Cohesion: 0.21
Nodes (10): DashboardPage(), dynamic, ActiveWorkout, Calendar, DashboardOverview(), fmt(), Profile, Program (+2 more)

### Community 52 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, allowJs, incremental, jsx, lib, paths, plugins, exclude (+3 more)

### Community 53 - "pr.ts"
Cohesion: 0.23
Nodes (10): brzyckiOneRm(), epleyOneRm(), ONE_RM_MAX_REPS, round2(), valid(), appendPersonalRecords(), BestRecords, PersonalRecord (+2 more)

### Community 54 - "Phase 1 (Fondasi)"
Cohesion: 0.17
Nodes (11): Gates, GymApps, Notes, Phase 1 (Fondasi), Phase 3 (Data & API inti), Phase 4 (UI loop utama), Phase 5 (AI program generator), Phase 6 (coach chat + rekomendasi) (+3 more)

### Community 55 - "ExportsPanel"
Cohesion: 0.25
Nodes (6): dynamic, ExportsPage(), currentMonth(), ExportRow, ExportsPanel(), size()

### Community 56 - "Product Requirements Document — GymApps v1.0 (Beta)"
Cohesion: 0.18
Nodes (11): 11. Acceptance Criteria Konsolidasi (Ringkasan), 15. Risiko & Mitigasi, 16. Pertanyaan Terbuka (Open Questions), 2.1 Goals v1, 2.2 Non-Goals v1, 2.3 Success Metrics (North Star & Guardrail), 2. Goals, Non-Goals, dan Success Metrics, Daftar Isi (+3 more)

### Community 57 - "jobs/package.json"
Cohesion: 0.18
Nodes (10): devDependencies, typescript, typescript, main, name, private, scripts, typecheck (+2 more)

### Community 58 - "[locale]/layout.tsx"
Cohesion: 0.22
Nodes (4): LayoutProps, viewport, THEME_STORAGE_KEY, themeScript

### Community 59 - "ADR-001 — Bentuk Program AI (Q-02)"
Cohesion: 0.20
Nodes (9): A — Program penuh sejak awal, ADR-001 — Bentuk Program AI (Q-02), B — Satu minggu di-roll, C — Hibrida, Keputusan, Konsekuensi, Konteks, Opsi (+1 more)

### Community 60 - "ADR-002 — Kapan Program Dianggap Stale (Q-06)"
Cohesion: 0.20
Nodes (9): A — Berbasis kalender, ADR-002 — Kapan Program Dianggap Stale (Q-06), B — Berbasis penyelesaian, C — Gabungan, Keputusan, Konsekuensi, Konteks, Opsi (+1 more)

### Community 61 - "ADR-003 — Retry Anthropic Sebelum Fallback (Q-08)"
Cohesion: 0.20
Nodes (9): A — Tanpa retry, langsung fallback, ADR-003 — Retry Anthropic Sebelum Fallback (Q-08), B — Retry terbatas per jenis error, C — Retry agresif (3–5×), Keputusan, Konsekuensi, Konteks, Opsi (+1 more)

### Community 62 - "ADR-004 — Data User Terhapus pada Statistik Agregat (Q-10)"
Cohesion: 0.20
Nodes (9): A — Hapus semua, termasuk agregat, ADR-004 — Data User Terhapus pada Statistik Agregat (Q-10), B — Anonimisasi ireversibel, C — Pertahankan baris agregat apa adanya, Keputusan, Konsekuensi, Konteks, Opsi (+1 more)

### Community 63 - "3. Fase"
Cohesion: 0.20
Nodes (10): 3. Fase, Fase 0 — Pre-flight (1–3 hari), Fase 1 — Fondasi (Sprint 1–2), Fase 2 — Domain murni (paralel Sprint 2–3), Fase 3 — Data & API inti (Sprint 3–4) — selesai, Fase 4 — UI loop utama (Sprint 4–5) — selesai, Fase 5 — AI program generator (Sprint 7–8) — selesai, Fase 6 — Coach chat + rekomendasi (Sprint 9–10) (+2 more)

### Community 64 - "exercise-library.tsx"
Cohesion: 0.28
Nodes (6): dynamic, ExercisesPage(), DIFFICULTY, Exercise, ExerciseLibrary(), MUSCLES

### Community 65 - "Data Model — GymApps v1"
Cohesion: 0.22
Nodes (9): 10. Migrasi, 1. Konvensi, 2. ERD, 7. Enum, 8.1 `mv_user_exercise_stats`, 8.2 `mv_user_weekly_volume`, 8. Query & View Analitik, 9. Strategi Retensi & Soft Delete (+1 more)

### Community 66 - "6. Tabel Pendukung"
Cohesion: 0.22
Nodes (9): 6.1 `sessions` (sesi login persisten), 6.2 `verification_tokens` (reset password), 6.3 `refresh_tokens` (untuk mobile), 6.4 `device_tokens` (stub notifikasi), 6.5 `audit_logs`, 6.6 `notifications` (in-app), 6.7 `feature_flags`, 6.8 `exports` (+1 more)

### Community 67 - "10. Non-Functional Requirements"
Cohesion: 0.22
Nodes (9): 10.1 Performa, 10.2 Skala & Kapasitas, 10.3 Keamanan, 10.4 Privasi & Kepatuhan, 10.5 Aksesibilitas (WCAG 2.1 AA), 10.6 Observabilitas, 10.7 Kualitas & Testing, 10.8 Dokumentasi & Operasional (+1 more)

### Community 68 - "9. Spesifikasi AI"
Cohesion: 0.22
Nodes (9): 9.1 Model & Routing, 9.2 Prinsip Keamanan AI, 9.3 Budget Token & Biaya, 9.4 Pipeline Generate Program, 9.5 Aturan Validator Program (deterministik), 9.6 Rule Engine Rekomendasi, 9.7 Guardrail Output Coach, 9.8 Evaluasi Kualitas AI (+1 more)

### Community 69 - "@prisma/client"
Cohesion: 0.39
Nodes (7): @prisma/client, call(), main(), ok(), prisma, register(), stamp

### Community 70 - "phase3-e2e.mjs"
Cohesion: 0.39
Nodes (8): call(), main(), ok(), prisma, register(), stamp, userA, userB

### Community 71 - "workouts-list.tsx"
Cohesion: 0.36
Nodes (5): dynamic, WorkoutsPage(), fmt(), Workout, WorkoutsList()

### Community 72 - "Fase 8 — Hardening & Beta"
Cohesion: 0.25
Nodes (7): Audit log, Blocker eksternal staging & beta, Blocking sebelum gate Fase 8 penuh, Fase 8 — Hardening & Beta, Hasil gate (2026-10-23), Perintah, Review PDP / privacy

### Community 73 - "3.1 Persona"
Cohesion: 0.25
Nodes (8): 3.1 Persona, 3.2 Use Case Utama, 3.3 Job-to-be-Done, 3. Persona & Use Cases, P1 — Pemula Konsisten ("Rani", 24 tahun), P2 — Intermediat Progresif ("Budi", 31 tahun), P3 — Pelatih & Konsultan ("Andra", 38 tahun), P4 — Power User Multi-Gym ("Agus", 45 tahun)

### Community 74 - "6. Arsitektur Teknis"
Cohesion: 0.25
Nodes (8): 6.1 Prinsip Arsitektur, 6.2 Tech Stack, 6.3 Diagram Arsitektur, 6.4 Struktur Direktori, 6.5 Alur Request Utama, 6.6 Strategi AI, 6.7 Roadmap ke Mobile, 6. Arsitektur Teknis

### Community 75 - "profile/route.ts"
Cohesion: 0.48
Nodes (6): GET, PATCH, profileWithUser(), runtime, serializeProfile(), profileSchema

### Community 76 - "5. Tabel AI"
Cohesion: 0.29
Nodes (7): feedback(), 5.1 `prompt_versions`, 5.2 `ai_generations` — Audit & Biaya, 5.3 `chat_threads`, 5.4 `chat_messages`, 5.5 `ai_recommendations`, 5. Tabel AI

### Community 77 - "3. Tabel Inti"
Cohesion: 0.29
Nodes (7): 3.1 `users` — Identitas & Preferensi, 3.2 `user_profiles` — Profil Latihan (1:1), 3.3 `entitlements` — Plan & Kuota, 3.4 `exercises` — Katalog Gerakan, 3.5 `exercise_aliases` — Nama Alternatives, 3.6 `exercise_media` — Gambar/Video, 3. Tabel Inti

### Community 78 - "Rencana Implementasi GymApps v1"
Cohesion: 0.29
Nodes (7): 1. Baseline, 2. Blocker sebelum kode, 4. Protokol perubahan, 5. Sinyal peringatan dini, 6. Urutan kritis, Rencana Implementasi GymApps v1, Status implementasi per 2026-10-22

### Community 79 - "[bodyMetricId]/route.ts"
Cohesion: 0.47
Nodes (5): DELETE, owned(), PATCH, runtime, bodyMetricUpdateSchema

### Community 80 - "Dokumentasi GymApps"
Cohesion: 0.33
Nodes (6): Dokumentasi GymApps, Dokumentasi Keudsaraan, Pertanyaan Terbuka, Peta Dokumen, Ringkasan Keputusan Produk, Urutan Pembacaan yang Disarankan

### Community 81 - "db/tsconfig.json"
Cohesion: 0.33
Nodes (5): compilerOptions, types, extends, include, ../../tsconfig.base.json

### Community 82 - "openapi.d.ts"
Cohesion: 0.33
Nodes (5): components, $defs, operations, paths, webhooks

### Community 83 - "shared/tsconfig.json"
Cohesion: 0.33
Nodes (5): compilerOptions, types, extends, include, ../../tsconfig.base.json

### Community 84 - "mock-chat-ai.mjs"
Cohesion: 0.47
Nodes (4): json(), requests, server, sseChunk()

### Community 85 - "one-rm/route.ts"
Cohesion: 0.50
Nodes (4): GET, runtime, analyticsOneRm(), analyticsOneRmSchema

### Community 86 - "personal-records/route.ts"
Cohesion: 0.50
Nodes (4): GET, runtime, analyticsPersonalRecords(), analyticsPrSchema

### Community 88 - "14. Roadmap"
Cohesion: 0.40
Nodes (5): 14. Roadmap, v1.0 — Beta (Target: 14 minggu kerja), v1.1 — Polish (4–6 minggu), v1.2 — Monetisasi & Integrasi (4–6 minggu), v2.0 — Mobile & Cerdas (8–12 minggu)

### Community 89 - "1. Ringkasan Eksekutif / Executive Summary"
Cohesion: 0.40
Nodes (5): 1.1 Masalah, 1.2 Solusi, 1.3 Proposisi Nilai, 1.4 Ringkasan Keputusan Produk, 1. Ringkasan Eksekutif / Executive Summary

### Community 90 - "8. Spesifikasi API"
Cohesion: 0.40
Nodes (5): 8.1 Konvensi, 8.2 Katalog Endpoint, 8.3 Contoh Payload Kunci, 8.4 Aturan Rate Limit, 8. Spesifikasi API

### Community 91 - "Lampiran B — Deskripsi Wireframe (Low-fidelity)"
Cohesion: 0.40
Nodes (5): B.1 Dashboard (`/dashboard`), B.2 Workout Logger (`/workouts/{id}`), B.3 Preview Program AI (`/programs/ai-preview`), B.4 Coach Chat (`/coach`), Lampiran B — Deskripsi Wireframe (Low-fidelity)

### Community 92 - "12. Analytics, Funnel & KPIs"
Cohesion: 0.50
Nodes (4): 12.1 Daftar Event (PostHog), 12.2 Funnel Aktivasi, 12.3 Metrik AI, 12. Analytics, Funnel & KPIs

### Community 93 - "13. Monetisasi (Rencana, Implementasi v1.2)"
Cohesion: 0.50
Nodes (4): 13.1 Model, 13.2 Alur Monetisasi Mendatang, 13.3 Yang Diprioritaskan Saat Monetisasi, 13. Monetisasi (Rencana, Implementasi v1.2)

### Community 94 - "4. Competitive Landscape & Positioning"
Cohesion: 0.50
Nodes (4): 4.1 Perbandingan Fitur, 4.2 Positioning Statement, 4.3 Prinsip Produk, 4. Competitive Landscape & Positioning

### Community 95 - "7. Model Data"
Cohesion: 0.50
Nodes (4): 7.1 ERD, 7.2 Entitas Utama, 7.3 Aturan Integritas Data, 7. Model Data

### Community 96 - "domain/tsconfig.json"
Cohesion: 0.50
Nodes (3): extends, include, ../../tsconfig.base.json

### Community 97 - "jobs/tsconfig.json"
Cohesion: 0.50
Nodes (3): extends, include, ../../tsconfig.base.json

## Knowledge Gaps
- **657 isolated node(s):** `withNextIntl`, `nextConfig`, `name`, `version`, `private` (+652 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 757 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `handler.ts` to `chat.ts`, `web/package.json`, `next-intl`, `phase6-validation.ts`, `session.ts`, `ApiError`, `exports.ts`, `analytics.ts`, `register/route.ts`, `context.ts`, `workouts/route.ts`, `parseQuery`, `onboarding-wizard.tsx`, `newId`, `login/route.ts`, `serializers.ts`, `programs-list.tsx`, `sets/route.ts`, `program-builder.tsx`, `workout-logger.tsx`, `reports.ts`, `react`, `parseJson`, `body-metrics/route.ts`, `phase4-validation.ts`, `log`, `getSession`, `dashboard-overview.tsx`, `[locale]/layout.tsx`, `exercise-library.tsx`, `workouts-list.tsx`, `profile/route.ts`, `[bodyMetricId]/route.ts`, `one-rm/route.ts`, `personal-records/route.ts`?**
  _High betweenness centrality (0.203) - this node is a cross-community bridge._
- **Why does `Product Requirements Document — GymApps v1.0 (Beta)` connect `Product Requirements Document — GymApps v1.0 (Beta)` to `5. Epics, User Stories & Prioritas`, `10. Non-Functional Requirements`, `9. Spesifikasi AI`, `3.1 Persona`, `6. Arsitektur Teknis`, `plan.md`, `14. Roadmap`, `1. Ringkasan Eksekutif / Executive Summary`, `8. Spesifikasi API`, `Lampiran B — Deskripsi Wireframe (Low-fidelity)`, `12. Analytics, Funnel & KPIs`, `13. Monetisasi (Rencana, Implementasi v1.2)`, `4. Competitive Landscape & Positioning`, `7. Model Data`?**
  _High betweenness centrality (0.120) - this node is a cross-community bridge._
- **Why does `@prisma/client` connect `@prisma/client` to `handler.ts`, `phase8-backup.mjs`, `phase5-e2e.mjs`, `phase3-e2e.mjs`, `phase7-e2e.mjs`, `phase6-e2e.mjs`, `phase8-load.mjs`, `db/package.json`, `seed.ts`?**
  _High betweenness centrality (0.112) - this node is a cross-community bridge._
- **What connects `withNextIntl`, `nextConfig`, `name` to the rest of the system?**
  _657 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `handler.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07117255504352278 - nodes in this community are weakly interconnected._
- **Should `chat.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06448087431693988 - nodes in this community are weakly interconnected._
- **Should `web/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.045454545454545456 - nodes in this community are weakly interconnected._