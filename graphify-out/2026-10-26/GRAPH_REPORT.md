# Graph Report - gymapps  (2026-10-23)

## Corpus Check
- 212 files · ~117,626 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: .example 3, (none) 1, .webmanifest 1)

## Summary
- 1575 nodes · 3361 edges · 100 communities (94 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0468220b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- handler.ts
- chat.ts
- web/package.json
- domain.test.ts
- scripts
- orchestrator.ts
- validator.ts
- navigation.ts
- phase6-serializers.ts
- session.ts
- AI Prompt Specification — GymApps v1
- parseJson
- exports.ts
- db/package.json
- analytics.ts
- register/route.ts
- context.ts
- [programId]/route.ts
- fallback-generator.ts
- auth.ts
- parseQuery
- onboarding-wizard.tsx
- domain/src/index.ts
- login/route.ts
- serializers.ts
- programs-list.tsx
- ApiError
- workout-logger.tsx
- shared/package.json
- threads/route.ts
- phase3-validation.ts
- schema.ts
- phase8-backup.mjs
- 5. Epics, User Stories & Prioritas
- phase5-e2e.mjs
- adherence/route.ts
- react
- ProgressTracker
- domain/package.json
- phase7-e2e.mjs
- compilerOptions
- recommendations-list.tsx
- CoachChat
- phase6-e2e.mjs
- phase8-load.mjs
- body-metrics/route.ts
- 4. Program & Latihan
- seed.ts
- phase4-validation.ts
- shared/src/index.ts
- getSession
- dashboard-overview.tsx
- compilerOptions
- estimateOneRm
- Phase 1 (Fondasi)
- ExportsPanel
- Product Requirements Document — GymApps v1.0 (Beta)
- jobs/package.json
- next-intl
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
- phase4-e2e.mjs
- @prisma/client
- workouts-list.tsx
- Fase 8 — Hardening & Beta
- 3.1 Persona
- 6. Arsitektur Teknis
- 5. Pipeline Program Generator
- 5. Tabel AI
- 3. Tabel Inti
- Rencana Implementasi GymApps v1
- 6. Coach Chat
- Dokumentasi GymApps
- db/tsconfig.json
- openapi.d.ts
- shared/tsconfig.json
- mock-ai.mjs
- me/route.ts
- 2. Goals, Non-Goals, dan Success Metrics
- 14. Roadmap
- 1. Ringkasan Eksekutif / Executive Summary
- 8. Spesifikasi API
- Lampiran B — Deskripsi Wireframe (Low-fidelity)
- 13. Monetisasi (Rencana, Implementasi v1.2)
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

## Communities (100 total, 6 thin omitted)

### Community 0 - "handler.ts"
Cohesion: 0.08
Nodes (37): runtime, runtime, DELETE, ownedThread(), runtime, runtime, GET, runtime (+29 more)

### Community 1 - "chat.ts"
Cohesion: 0.07
Nodes (48): ownedThread(), POST, runtime, streamResponse(), buildChatContext(), CHAT_MAX_CONTEXT_TOKENS, ChatCard, ChatCitation (+40 more)

### Community 2 - "web/package.json"
Cohesion: 0.04
Nodes (45): dependencies, @gymapps/db, @gymapps/domain, @gymapps/shared, next, next-intl, @node-rs/argon2, playwright-core (+37 more)

### Community 3 - "domain.test.ts"
Cohesion: 0.08
Nodes (20): Candidate, candidatesFor(), evaluateRecommendationsForUser(), isoDate(), PULL, PUSH, SEVERITY_ORDER, startOfWeek() (+12 more)

### Community 4 - "scripts"
Cohesion: 0.05
Nodes (41): compat, config, dependencies, @upstash/ratelimit, @upstash/redis, devDependencies, eslint, eslint-config-next (+33 more)

### Community 5 - "orchestrator.ts"
Cohesion: 0.08
Nodes (34): GET, runtime, POST, runtime, STEPS, asMetadata(), completenessIssues(), createProgramGenerationJob() (+26 more)

### Community 6 - "validator.ts"
Cohesion: 0.15
Nodes (21): ValidationContext, ValidationIssue, ValidationResult, averageReps(), BIG_MUSCLES, isInt(), isNum(), isRecord() (+13 more)

### Community 7 - "navigation.ts"
Cohesion: 0.20
Nodes (9): AuthLayout(), LoginPage(), RegisterPage(), LoginForm(), RegisterForm(), LocaleSwitcher(), getPathname, Link (+1 more)

### Community 8 - "phase6-serializers.ts"
Cohesion: 0.13
Nodes (10): GET, runtime, SEVERITY_ORDER, GET, runtime, serializeMessage(), serializeNotification(), serializeRecommendation() (+2 more)

### Community 9 - "session.ts"
Cohesion: 0.13
Nodes (15): POST, runtime, POST, runtime, attachSessionCookie(), clearSessionCookie(), cookieOptions(), revokeAllSessions() (+7 more)

### Community 10 - "AI Prompt Specification — GymApps v1"
Cohesion: 0.11
Nodes (18): 10.1 Kasus Otomatis (CI, 20 kasus), 10.2 Kasus Manual (50 kasus, review mingguan), 10.3 Red-Team Set (30 prompt, wajib 0 violation), 10. Eval Set, 11. Monitoring & Biaya, 12. Fallback & Kill-Switch, 1. Prinsip, 2. Model & Konfigurasi (+10 more)

### Community 11 - "parseJson"
Cohesion: 0.17
Nodes (23): POST, POST, runtime, PATCH, POST, POST, POST, runtime (+15 more)

### Community 12 - "exports.ts"
Cohesion: 0.05
Nodes (54): DELETE, GET, ownedExport(), runtime, GET, POST, runtime, GET (+46 more)

### Community 13 - "db/package.json"
Cohesion: 0.07
Nodes (28): dependencies, @prisma/client, ulid, devDependencies, prisma, tsx, @types/node, typescript (+20 more)

### Community 14 - "analytics.ts"
Cohesion: 0.11
Nodes (22): GET, runtime, GET, runtime, GET, runtime, analyticsCalendar(), analyticsOneRm() (+14 more)

### Community 15 - "register/route.ts"
Cohesion: 0.17
Nodes (11): POST, runtime, requestIdFor(), withApi(), hashPassword(), verifyPassword(), createSession(), hashToken() (+3 more)

### Community 16 - "context.ts"
Cohesion: 0.19
Nodes (7): BODY_AREAS, bodyArea(), buildProgramContext(), ContextArrayKey, fitContext(), hashContext(), MAX_CONTEXT_TOKENS

### Community 17 - "[programId]/route.ts"
Cohesion: 0.23
Nodes (16): POST, runtime, POST, DELETE, PATCH, runtime, POST, runtime (+8 more)

### Community 18 - "fallback-generator.ts"
Cohesion: 0.12
Nodes (23): BALANCE_MUSCLES, balanceWeek(), broPlans(), DayPlan, estimatedSeconds(), estimateSecond(), ExerciseMetaMap, FULL_BODY_MUSCLES (+15 more)

### Community 19 - "auth.ts"
Cohesion: 0.14
Nodes (12): email, LoginInput, LoginRequest, loginSchema, newPassword, RegisterInput, RegisterRequest, ARGON2_OPTIONS (+4 more)

### Community 20 - "parseQuery"
Cohesion: 0.22
Nodes (17): GET, GET, GET, GET, POST, runtime, validateWorkout(), GET (+9 more)

### Community 21 - "onboarding-wizard.tsx"
Cohesion: 0.15
Nodes (12): dynamic, OnboardingPage(), ClassNames(), EQUIPMENT, Form, GOALS, INITIAL, INJURIES (+4 more)

### Community 22 - "domain/src/index.ts"
Cohesion: 0.15
Nodes (13): ADR-0002, AdherenceDropInput, DeloadInput, ImbalanceInput, PlateauInput, StaleProgramInput, DAY_MS, Recommendation (+5 more)

### Community 23 - "login/route.ts"
Cohesion: 0.30
Nodes (10): POST, runtime, rateLimitHeaders(), checkLoginRateLimit(), clearLoginRateLimit(), loginRateLimitKey(), recordLoginFailure(), scopedKey() (+2 more)

### Community 24 - "serializers.ts"
Cohesion: 0.10
Nodes (27): GET, GET, runtime, runtime, runtime, detail(), GET, PATCH (+19 more)

### Community 25 - "programs-list.tsx"
Cohesion: 0.12
Nodes (17): dynamic, ProgramsPage(), GOALS, Program, ProgramsList(), activate(), archive(), load() (+9 more)

### Community 26 - "ApiError"
Cohesion: 0.25
Nodes (15): PATCH, POST, runtime, DELETE, PATCH, runtime, POST, ApiError (+7 more)

### Community 27 - "workout-logger.tsx"
Cohesion: 0.08
Nodes (21): dynamic, ProgramPage(), dynamic, WorkoutPage(), EQUIPMENT, ExercisePicker(), MUSCLES, PickedExercise (+13 more)

### Community 28 - "shared/package.json"
Cohesion: 0.11
Nodes (17): dependencies, zod, devDependencies, openapi-typescript, typescript, typescript, zod, main (+9 more)

### Community 29 - "threads/route.ts"
Cohesion: 0.16
Nodes (13): POST, runtime, chatQuota(), serializeThread(), exerciseAdminListSchema, exerciseAdminUpdateSchema, exportCreateSchema, feedbackSchema (+5 more)

### Community 30 - "phase3-validation.ts"
Cohesion: 0.07
Nodes (36): PATCH, GET, POST, runtime, DELETE, findVisibleExercise(), GET, PATCH (+28 more)

### Community 31 - "schema.ts"
Cohesion: 0.13
Nodes (9): EmitProgram, emitProgramSchema, exercise, NormalizedProgram, NormalizeInput, progression, session, week (+1 more)

### Community 32 - "phase8-backup.mjs"
Cohesion: 0.15
Nodes (12): compose, counts(), docker(), main(), prisma, root, buildId, main() (+4 more)

### Community 33 - "5. Epics, User Stories & Prioritas"
Cohesion: 0.12
Nodes (16): 5.1 Ringkasan Epik, 5. Epics, User Stories & Prioritas, EP-01 — Authentication & Account, EP-02 — Onboarding & User Profile, EP-03 — Exercise Library, EP-04 — Workout Logging (Strength), EP-05 — Cardio Logging (Prioritas: Should), EP-06 — Manual Program Builder & Templates (+8 more)

### Community 34 - "phase5-e2e.mjs"
Cohesion: 0.26
Nodes (15): assertBodyweightKneeSafe(), assertSessionCount(), call(), children, generate(), main(), ok(), prisma (+7 more)

### Community 35 - "adherence/route.ts"
Cohesion: 0.28
Nodes (7): GET, runtime, GET, runtime, analyticsAdherence(), analyticsMuscleBalance(), analyticsWeeksSchema

### Community 36 - "react"
Cohesion: 0.21
Nodes (11): AppLayout(), dynamic, LogoutButton(), Notification, NotificationBell(), load(), openNotification(), readAll() (+3 more)

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

### Community 41 - "recommendations-list.tsx"
Cohesion: 0.36
Nodes (5): dynamic, RecommendationsPage(), evidenceRows(), Recommendation, RecommendationsList()

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
Cohesion: 0.16
Nodes (14): DELETE, owned(), PATCH, runtime, GET, POST, runtime, GET (+6 more)

### Community 46 - "4. Program & Latihan"
Cohesion: 0.15
Nodes (13): 4.10 `notes`, 4.11 `workout_templates`, 4.12 `workout_template_exercises`, 4.1 `programs`, 4.2 `program_weeks`, 4.3 `program_sessions`, 4.4 `program_exercises`, 4.5 `workouts` — Sesi Tercatat (+5 more)

### Community 47 - "seed.ts"
Cohesion: 0.18
Nodes (12): buildExercises(), equipment, EquipmentCode, equipmentLabel, main(), Movement, movements, muscles (+4 more)

### Community 48 - "phase4-validation.ts"
Cohesion: 0.12
Nodes (16): GET, runtime, GET, runtime, analyticsPersonalRecords(), analyticsPrSchema, analyticsVolumeSchema, bodyMetricListSchema (+8 more)

### Community 49 - "shared/src/index.ts"
Cohesion: 0.48
Nodes (3): AuthSession, CurrentUser, ErrorResponse

### Community 50 - "getSession"
Cohesion: 0.26
Nodes (10): AdminExercisesPage(), dynamic, AdminExerciseEditor(), load(), save(), select(), Exercise, formFrom() (+2 more)

### Community 51 - "dashboard-overview.tsx"
Cohesion: 0.21
Nodes (10): DashboardPage(), dynamic, ActiveWorkout, Calendar, DashboardOverview(), fmt(), Profile, Program (+2 more)

### Community 52 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, allowJs, incremental, jsx, lib, paths, plugins, exclude (+3 more)

### Community 53 - "estimateOneRm"
Cohesion: 0.22
Nodes (12): brzyckiOneRm(), epleyOneRm(), estimateOneRm(), ONE_RM_MAX_REPS, round2(), valid(), appendPersonalRecords(), BestRecords (+4 more)

### Community 54 - "Phase 1 (Fondasi)"
Cohesion: 0.17
Nodes (11): Gates, GymApps, Notes, Phase 1 (Fondasi), Phase 3 (Data & API inti), Phase 4 (UI loop utama), Phase 5 (AI program generator), Phase 6 (coach chat + rekomendasi) (+3 more)

### Community 55 - "ExportsPanel"
Cohesion: 0.25
Nodes (6): dynamic, ExportsPage(), currentMonth(), ExportRow, ExportsPanel(), size()

### Community 56 - "Product Requirements Document — GymApps v1.0 (Beta)"
Cohesion: 0.11
Nodes (19): 11. Acceptance Criteria Konsolidasi (Ringkasan), 12.1 Daftar Event (PostHog), 12.2 Funnel Aktivasi, 12.3 Metrik AI, 12. Analytics, Funnel & KPIs, 15. Risiko & Mitigasi, 16. Pertanyaan Terbuka (Open Questions), 4.1 Perbandingan Fitur (+11 more)

### Community 57 - "jobs/package.json"
Cohesion: 0.18
Nodes (10): devDependencies, typescript, typescript, main, name, private, scripts, typecheck (+2 more)

### Community 58 - "next-intl"
Cohesion: 0.14
Nodes (10): nextConfig, withNextIntl, LayoutProps, viewport, Theme, themes, routing, THEME_STORAGE_KEY (+2 more)

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

### Community 69 - "phase4-e2e.mjs"
Cohesion: 0.57
Nodes (6): call(), main(), ok(), prisma, register(), stamp

### Community 70 - "@prisma/client"
Cohesion: 0.29
Nodes (9): @prisma/client, call(), main(), ok(), prisma, register(), stamp, userA (+1 more)

### Community 71 - "workouts-list.tsx"
Cohesion: 0.36
Nodes (5): dynamic, WorkoutsPage(), fmt(), Workout, WorkoutsList()

### Community 72 - "Fase 8 — Hardening & Beta"
Cohesion: 0.22
Nodes (8): Audit log, Blocker eksternal staging & beta, Blocking sebelum gate Fase 8 penuh, Fase 8 — Hardening & Beta, Hasil gate (2026-10-23), Index review query panas, Perintah, Review PDP / privacy

### Community 73 - "3.1 Persona"
Cohesion: 0.25
Nodes (8): 3.1 Persona, 3.2 Use Case Utama, 3.3 Job-to-be-Done, 3. Persona & Use Cases, P1 — Pemula Konsisten ("Rani", 24 tahun), P2 — Intermediat Progresif ("Budi", 31 tahun), P3 — Pelatih & Konsultan ("Andra", 38 tahun), P4 — Power User Multi-Gym ("Agus", 45 tahun)

### Community 74 - "6. Arsitektur Teknis"
Cohesion: 0.25
Nodes (8): 6.1 Prinsip Arsitektur, 6.2 Tech Stack, 6.3 Diagram Arsitektur, 6.4 Struktur Direktori, 6.5 Alur Request Utama, 6.6 Strategi AI, 6.7 Roadmap ke Mobile, 6. Arsitektur Teknis

### Community 75 - "5. Pipeline Program Generator"
Cohesion: 0.29
Nodes (7): 5.1 Tahapan, 5.2 Tool `emit_program`, 5.3 System Prompt — `program_generator` (v1), 5.4 System Prompt — `repair_pass` (v1), 5.5 Validator — Aturan V-01 … V-13, 5.6 Fallback Generator (Rule-based), 5. Pipeline Program Generator

### Community 76 - "5. Tabel AI"
Cohesion: 0.29
Nodes (7): feedback(), 5.1 `prompt_versions`, 5.2 `ai_generations` — Audit & Biaya, 5.3 `chat_threads`, 5.4 `chat_messages`, 5.5 `ai_recommendations`, 5. Tabel AI

### Community 77 - "3. Tabel Inti"
Cohesion: 0.29
Nodes (7): 3.1 `users` — Identitas & Preferensi, 3.2 `user_profiles` — Profil Latihan (1:1), 3.3 `entitlements` — Plan & Kuota, 3.4 `exercises` — Katalog Gerakan, 3.5 `exercise_aliases` — Nama Alternatives, 3.6 `exercise_media` — Gambar/Video, 3. Tabel Inti

### Community 78 - "Rencana Implementasi GymApps v1"
Cohesion: 0.29
Nodes (7): 1. Baseline, 2. Blocker sebelum kode, 4. Protokol perubahan, 5. Sinyal peringatan dini, 6. Urutan kritis, Rencana Implementasi GymApps v1, Status implementasi per 2026-10-22

### Community 79 - "6. Coach Chat"
Cohesion: 0.33
Nodes (6): 6.1 System Prompt — `coach_chat` (v1), 6.2 Tools Coach, 6.3 Format Respons Coach, 6.4 Streaming, 6.5 Deteksi Bahasa, 6. Coach Chat

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

### Community 84 - "mock-ai.mjs"
Cohesion: 0.22
Nodes (9): contextFrom(), emitProgram(), json(), requests, server, json(), requests, server (+1 more)

### Community 85 - "me/route.ts"
Cohesion: 0.60
Nodes (4): GET, runtime, getEntitlement(), toCurrentUser()

### Community 86 - "2. Goals, Non-Goals, dan Success Metrics"
Cohesion: 0.50
Nodes (4): 2.1 Goals v1, 2.2 Non-Goals v1, 2.3 Success Metrics (North Star & Guardrail), 2. Goals, Non-Goals, dan Success Metrics

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

### Community 93 - "13. Monetisasi (Rencana, Implementasi v1.2)"
Cohesion: 0.50
Nodes (4): 13.1 Model, 13.2 Alur Monetisasi Mendatang, 13.3 Yang Diprioritaskan Saat Monetisasi, 13. Monetisasi (Rencana, Implementasi v1.2)

### Community 96 - "domain/tsconfig.json"
Cohesion: 0.50
Nodes (3): extends, include, ../../tsconfig.base.json

### Community 97 - "jobs/tsconfig.json"
Cohesion: 0.50
Nodes (3): extends, include, ../../tsconfig.base.json

## Knowledge Gaps
- **662 isolated node(s):** `withNextIntl`, `nextConfig`, `name`, `version`, `private` (+657 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 764 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `handler.ts` to `chat.ts`, `web/package.json`, `orchestrator.ts`, `navigation.ts`, `phase6-serializers.ts`, `session.ts`, `parseJson`, `exports.ts`, `analytics.ts`, `register/route.ts`, `[programId]/route.ts`, `parseQuery`, `onboarding-wizard.tsx`, `login/route.ts`, `serializers.ts`, `programs-list.tsx`, `ApiError`, `workout-logger.tsx`, `threads/route.ts`, `phase3-validation.ts`, `adherence/route.ts`, `react`, `body-metrics/route.ts`, `phase4-validation.ts`, `getSession`, `dashboard-overview.tsx`, `next-intl`, `exercise-library.tsx`, `workouts-list.tsx`, `me/route.ts`?**
  _High betweenness centrality (0.195) - this node is a cross-community bridge._
- **Why does `Product Requirements Document — GymApps v1.0 (Beta)` connect `Product Requirements Document — GymApps v1.0 (Beta)` to `5. Epics, User Stories & Prioritas`, `10. Non-Functional Requirements`, `9. Spesifikasi AI`, `3.1 Persona`, `6. Arsitektur Teknis`, `2. Goals, Non-Goals, dan Success Metrics`, `plan.md`, `14. Roadmap`, `1. Ringkasan Eksekutif / Executive Summary`, `8. Spesifikasi API`, `Lampiran B — Deskripsi Wireframe (Low-fidelity)`, `13. Monetisasi (Rencana, Implementasi v1.2)`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **Why does `@prisma/client` connect `@prisma/client` to `handler.ts`, `phase8-backup.mjs`, `phase5-e2e.mjs`, `phase4-e2e.mjs`, `phase7-e2e.mjs`, `phase6-e2e.mjs`, `phase8-load.mjs`, `db/package.json`, `seed.ts`?**
  _High betweenness centrality (0.101) - this node is a cross-community bridge._
- **What connects `withNextIntl`, `nextConfig`, `name` to the rest of the system?**
  _662 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `handler.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08082706766917293 - nodes in this community are weakly interconnected._
- **Should `chat.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06721215663354763 - nodes in this community are weakly interconnected._
- **Should `web/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.043478260869565216 - nodes in this community are weakly interconnected._