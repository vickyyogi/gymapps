# Graph Report - gymapps  (2026-10-27)

## Corpus Check
- 262 files · ~136,215 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: (none) 3, .example 3, .webmanifest 1)

## Summary
- 1860 nodes · 4147 edges · 122 communities (114 shown, 8 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 21 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e9b73074`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- handler.ts
- chat.ts
- web/package.json
- prisma
- scripts
- orchestrator.ts
- domain.test.ts
- client.ts
- context.ts
- session.ts
- AI Prompt Specification — GymApps v1
- workouts/route.ts
- exports.ts
- db/package.json
- api/analytics.ts
- register/route.ts
- serializers.ts
- onboarding/page.tsx
- validator.ts
- auth.ts
- jobs.ts
- onboarding-wizard.tsx
- domain/src/index.ts
- login/route.ts
- v1/exercises/[exerciseId]/route.ts
- programs-list.tsx
- workout-logger.tsx
- shared/package.json
- phase5-validation.ts
- admin/exercises/route.ts
- Observability
- phase8-backup.mjs
- 5. Epics, User Stories & Prioritas
- phase5-e2e.mjs
- mock-ai.mjs
- ApiError
- ProgressTracker
- domain/package.json
- phase7-e2e.mjs
- compilerOptions
- recommendations-list.tsx
- CoachChat
- phase6-e2e.mjs
- phase8-load.mjs
- parseQuery
- 4. Program & Latihan
- clientIp
- Fase 8 — Hardening & Beta
- body-metrics/route.ts
- getSession
- dashboard-overview.tsx
- compilerOptions
- estimateOneRm
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
- phase4-e2e.mjs
- @prisma/client
- workouts-list.tsx
- next.config.ts
- 3.1 Persona
- 6. Arsitektur Teknis
- checks
- 5. Tabel AI
- 3. Tabel Inti
- Rencana Implementasi GymApps v1
- phase4-validation.ts
- Dokumentasi GymApps
- db/tsconfig.json
- openapi.d.ts
- shared/tsconfig.json
- messages/route.ts
- verification.ts
- web
- 14. Roadmap
- 1. Ringkasan Eksekutif / Executive Summary
- 8. Spesifikasi API
- Lampiran B — Deskripsi Wireframe (Low-fidelity)
- Components
- SettingsPanel
- rate-limit-store.ts
- workout-logger.tsx
- domain/tsconfig.json
- jobs/tsconfig.json
- postcss.config.mjs
- sw.js
- 5. Pipeline Program Generator
- Deploy (container)
- 6. Coach Chat
- profile/route.ts
- parseJson
- phase8-backup.mjs
- one-rm/route.ts
- WorkoutLogger
- volume/route.ts
- ai-program-generator.tsx
- personal-records/route.ts
- fallback-generator.ts
- summary/route.ts
- next-intl
- 2. Goals, Non-Goals, dan Success Metrics
- 4. Competitive Landscape & Positioning
- 7. Model Data
- AGENTS.md
- web/AGENTS.md
- checkQuota

## God Nodes (most connected - your core abstractions)
1. `ApiError` - 103 edges
2. `next` - 92 edges
3. `parseJson()` - 73 edges
4. `prisma` - 67 edges
5. `withAuthApi()` - 60 edges
6. `newId()` - 55 edges
7. `next-intl` - 47 edges
8. `clientIp()` - 37 edges
9. `parseQuery()` - 36 edges
10. `log()` - 32 edges

## Surprising Connections (you probably didn't know these)
- `Event yang dikirim` --references--> `onRequestError()`  [INFERRED]
  docs/observability.md → apps/web/src/instrumentation.ts
- `Review PDP / privacy` --references--> `purgeExpiredAccounts()`  [INFERRED]
  docs/phase8-hardening.md → apps/web/src/lib/account-retention.ts
- `Index review query panas` --references--> `analyticsVolume()`  [INFERRED]
  docs/phase8-hardening.md → apps/web/src/lib/api/analytics.ts
- `5.4 `chat_messages`` --references--> `feedback()`  [INFERRED]
  docs/data-model.md → apps/web/src/components/phase6/coach-chat.tsx
- `8. Post-Processing & Moderasi` --references--> `context()`  [INFERRED]
  docs/ai/prompt-spec.md → packages/domain/src/domain.test.ts

## Import Cycles
- None detected.

## Communities (122 total, 8 thin omitted)

### Community 0 - "handler.ts"
Cohesion: 0.08
Nodes (28): DELETE, ownedThread(), runtime, GET, runtime, GET, GROUPS, runtime (+20 more)

### Community 1 - "chat.ts"
Cohesion: 0.14
Nodes (20): buildChatContext(), CHAT_MAX_CONTEXT_TOKENS, ChatCard, ChatCitation, ChatSend, ChatTurnInput, dayIndex(), endpoint() (+12 more)

### Community 2 - "web/package.json"
Cohesion: 0.06
Nodes (48): dependencies, @aws-sdk/client-s3@^3.1156.0, @gymapps/db@*, @gymapps/domain@*, @gymapps/shared@*, next@^16.4.3, next-intl@^4.14.9, @node-rs/argon2@^2.2.2 (+40 more)

### Community 3 - "prisma"
Cohesion: 0.07
Nodes (27): POST, runtime, PATCH, runtime, GET, runtime, SEVERITY_ORDER, PATCH (+19 more)

### Community 4 - "scripts"
Cohesion: 0.06
Nodes (36): compat, config, devDependencies, eslint@^9.39.5, eslint-config-next@^15.5.28, @eslint/eslintrc@^3.3.1, typescript@^5.9.3, engines (+28 more)

### Community 5 - "orchestrator.ts"
Cohesion: 0.17
Nodes (18): GET, runtime, asMetadata(), completenessIssues(), failJob(), GOAL_LABEL, JobMetadata, jobResponse() (+10 more)

### Community 6 - "domain.test.ts"
Cohesion: 0.31
Nodes (6): 8. Post-Processing & Moderasi, BIG_MUSCLES, catalog(), context(), generated(), input()

### Community 7 - "client.ts"
Cohesion: 0.17
Nodes (17): AiClientError, AiErrorCode, CallInput, callProgramModel(), CallResult, computeCostUsd(), emitProgramTool, endpoint() (+9 more)

### Community 8 - "context.ts"
Cohesion: 0.29
Nodes (8): BODY_AREAS, bodyArea(), buildProgramContext(), ContextArrayKey, fitContext(), hashContext(), MAX_CONTEXT_TOKENS, redactPII()

### Community 9 - "session.ts"
Cohesion: 0.13
Nodes (17): POST, runtime, POST, runtime, attachSessionCookie(), clearSessionCookie(), cookieOptions(), revokeAllSessions() (+9 more)

### Community 10 - "AI Prompt Specification — GymApps v1"
Cohesion: 0.11
Nodes (18): 10.1 Kasus Otomatis (CI, 20 kasus), 10.2 Kasus Manual (50 kasus, review mingguan), 10.3 Red-Team Set (30 prompt, wajib 0 violation), 10. Eval Set, 11. Monitoring & Biaya, 12. Fallback & Kill-Switch, 1. Prinsip, 2. Model & Konfigurasi (+10 more)

### Community 11 - "workouts/route.ts"
Cohesion: 0.18
Nodes (16): GET, runtime, POST, runtime, DELETE, detail(), GET, PATCH (+8 more)

### Community 12 - "exports.ts"
Cohesion: 0.07
Nodes (40): GET, runtime, DELETE, GET, ownedExport(), runtime, GET, GET (+32 more)

### Community 13 - "db/package.json"
Cohesion: 0.06
Nodes (43): dependencies, dotenv@^17.4.2, @prisma/adapter-pg@^7.10.1, @prisma/client@^7.10.1, ulid@^3.0.2, devDependencies, prisma@^7.10.1, tsx@^4.23.15 (+35 more)

### Community 14 - "api/analytics.ts"
Cohesion: 0.13
Nodes (22): GET, runtime, GET, runtime, GET, runtime, analyticsAdherence(), analyticsCalendar() (+14 more)

### Community 15 - "register/route.ts"
Cohesion: 0.20
Nodes (20): POST, runtime, POST, runtime, POST, runtime, GET, runtime (+12 more)

### Community 16 - "serializers.ts"
Cohesion: 0.10
Nodes (21): POST, runtime, DELETE, GET, PATCH, runtime, runtime, programInputSchema (+13 more)

### Community 17 - "onboarding/page.tsx"
Cohesion: 0.14
Nodes (20): lucide-react@^1.61.0, AppLayout(), dynamic, AuthLayout(), AppSidebar(), ICONS, NavItem, NavLinks() (+12 more)

### Community 18 - "validator.ts"
Cohesion: 0.18
Nodes (18): averageReps(), BIG_MUSCLES, isInt(), isNum(), isRecord(), issue(), parseProgram(), SPLITS (+10 more)

### Community 19 - "auth.ts"
Cohesion: 0.09
Nodes (25): birthDateSchema, ChangePasswordInput, ChangePasswordRequest, changePasswordSchema, DeleteAccountInput, DeleteAccountRequest, deleteAccountSchema, email (+17 more)

### Community 20 - "jobs.ts"
Cohesion: 0.17
Nodes (18): onRequestError(), register(), analyticsEnabled(), captureError(), host(), send(), track(), failure() (+10 more)

### Community 21 - "onboarding-wizard.tsx"
Cohesion: 0.14
Nodes (12): dynamic, OnboardingPage(), VerifyEmailGate(), ClassNames(), EQUIPMENT, Form, GOALS, INITIAL (+4 more)

### Community 22 - "domain/src/index.ts"
Cohesion: 0.07
Nodes (38): narratorAiConfig(), Candidate, candidatesFor(), evaluateRecommendationsForUser(), isoDate(), narrate(), PULL, PUSH (+30 more)

### Community 23 - "login/route.ts"
Cohesion: 0.24
Nodes (15): POST, runtime, GET, runtime, rateLimitHeaders(), checkLoginRateLimit(), clearLoginRateLimit(), loginRateLimitKey() (+7 more)

### Community 24 - "v1/exercises/[exerciseId]/route.ts"
Cohesion: 0.32
Nodes (7): DELETE, findVisibleExercise(), GET, PATCH, runtime, updateExerciseSchema, serializeExerciseDetail()

### Community 25 - "programs-list.tsx"
Cohesion: 0.23
Nodes (9): dynamic, ProgramsPage(), GOALS, Program, ProgramsList(), activate(), archive(), load() (+1 more)

### Community 27 - "workout-logger.tsx"
Cohesion: 0.13
Nodes (11): dynamic, ProgramPage(), EQUIPMENT, ExercisePicker(), MUSCLES, PickedExercise, Program, ProgramBuilder() (+3 more)

### Community 28 - "shared/package.json"
Cohesion: 0.12
Nodes (19): dependencies, vitest@5.0.5, zod@^4.6.7, devDependencies, openapi-typescript@^7.13.0, typescript@^5.9.3, typescript, vitest (+11 more)

### Community 29 - "phase5-validation.ts"
Cohesion: 0.18
Nodes (11): POST, runtime, STEPS, createProgramGenerationJob(), EQUIPMENT, generateShapeError(), GOALS, MUSCLES (+3 more)

### Community 30 - "admin/exercises/route.ts"
Cohesion: 0.22
Nodes (15): PATCH, runtime, GET, POST, runtime, POST, runtime, createExerciseSchema (+7 more)

### Community 31 - "Observability"
Cohesion: 0.33
Nodes (5): Alert (NFR-OBS-06), Belum ada, Dashboard (NFR-OBS-05), Event yang dikirim, Observability

### Community 32 - "phase8-backup.mjs"
Cohesion: 0.27
Nodes (6): buildId, main(), root, run(), stop(), waitFor()

### Community 33 - "5. Epics, User Stories & Prioritas"
Cohesion: 0.12
Nodes (16): 5.1 Ringkasan Epik, 5. Epics, User Stories & Prioritas, EP-01 — Authentication & Account, EP-02 — Onboarding & User Profile, EP-03 — Exercise Library, EP-04 — Workout Logging (Strength), EP-05 — Cardio Logging (Prioritas: Should), EP-06 — Manual Program Builder & Templates (+8 more)

### Community 34 - "phase5-e2e.mjs"
Cohesion: 0.25
Nodes (15): assertBodyweightKneeSafe(), assertSessionCount(), call(), children, generate(), main(), ok(), prisma (+7 more)

### Community 35 - "mock-ai.mjs"
Cohesion: 0.24
Nodes (9): contextFrom(), emitProgram(), json(), requests, server, json(), requests, server (+1 more)

### Community 36 - "ApiError"
Cohesion: 0.21
Nodes (20): DELETE, runtime, POST, runtime, DELETE, PATCH, runtime, POST (+12 more)

### Community 37 - "ProgressTracker"
Cohesion: 0.17
Nodes (8): dynamic, ProgressPage(), BodyMetric, CATEGORIES, fmt(), Note, ProgressTracker(), today()

### Community 38 - "domain/package.json"
Cohesion: 0.15
Nodes (14): devDependencies, typescript@^5.9.3, vitest@^5.0.5, typescript, vitest, main, name, private (+6 more)

### Community 39 - "phase7-e2e.mjs"
Cohesion: 0.25
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
Cohesion: 0.25
Nodes (13): call(), children, createProgram(), main(), ok(), prisma, readSse(), register() (+5 more)

### Community 44 - "phase8-load.mjs"
Cohesion: 0.23
Nodes (14): 3.4 `exercises` — Katalog Gerakan, call(), main(), measure(), worker(), opsMetrics(), percentile(), prisma (+6 more)

### Community 45 - "parseQuery"
Cohesion: 0.36
Nodes (11): GET, GET, GET, GET, GET, GET, parseQuery(), decodeCursor() (+3 more)

### Community 46 - "4. Program & Latihan"
Cohesion: 0.15
Nodes (13): 4.10 `notes`, 4.11 `workout_templates`, 4.12 `workout_template_exercises`, 4.1 `programs`, 4.2 `program_weeks`, 4.3 `program_sessions`, 4.4 `program_exercises`, 4.5 `workouts` — Sesi Tercatat (+5 more)

### Community 47 - "clientIp"
Cohesion: 0.13
Nodes (33): DELETE, runtime, ADR-0004, POST, runtime, POST, runtime, POST (+25 more)

### Community 48 - "Fase 8 — Hardening & Beta"
Cohesion: 0.25
Nodes (7): Audit log, Blocker eksternal staging & beta, Blocking sebelum gate Fase 8 penuh, Fase 8 — Hardening & Beta, Hasil gate (2026-10-23), Perintah, Review PDP / privacy

### Community 49 - "body-metrics/route.ts"
Cohesion: 0.15
Nodes (12): DELETE, owned(), PATCH, runtime, GET, POST, runtime, num() (+4 more)

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
Cohesion: 0.16
Nodes (16): 12.1 Daftar Event (PostHog), 12.2 Funnel Aktivasi, 12.3 Metrik AI, 12. Analytics, Funnel & KPIs, brzyckiOneRm(), epleyOneRm(), estimateOneRm(), ONE_RM_MAX_REPS (+8 more)

### Community 54 - "Phase 1 (Fondasi)"
Cohesion: 0.14
Nodes (13): Deploy, Gates, GymApps, Notes, Observability, Phase 1 (Fondasi), Phase 3 (Data & API inti), Phase 4 (UI loop utama) (+5 more)

### Community 55 - "ExportsPanel"
Cohesion: 0.25
Nodes (6): dynamic, ExportsPage(), currentMonth(), ExportRow, ExportsPanel(), size()

### Community 56 - "Product Requirements Document — GymApps v1.0 (Beta)"
Cohesion: 0.18
Nodes (11): 11. Acceptance Criteria Konsolidasi (Ringkasan), 13.1 Model, 13.2 Alur Monetisasi Mendatang, 13.3 Yang Diprioritaskan Saat Monetisasi, 13. Monetisasi (Rencana, Implementasi v1.2), 15. Risiko & Mitigasi, 16. Pertanyaan Terbuka (Open Questions), Daftar Isi (+3 more)

### Community 57 - "jobs/package.json"
Cohesion: 0.20
Nodes (10): devDependencies, typescript@^5.9.3, typescript, main, name, private, scripts, typecheck (+2 more)

### Community 58 - "[locale]/layout.tsx"
Cohesion: 0.13
Nodes (11): react@^19.2.0, LayoutProps, viewport, ProfileData, TIMEZONES, Theme, THEMES, DesignTokens (+3 more)

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
Cohesion: 0.13
Nodes (12): dynamic, ExercisesPage(), DIFFICULTY, EQUIPMENT_LIST, Exercise, ExerciseDetail, ExerciseLibrary(), openDetail() (+4 more)

### Community 65 - "Data Model — GymApps v1"
Cohesion: 0.22
Nodes (9): 10. Migrasi, 1. Konvensi, 2. ERD, 7. Enum, 8.1 `mv_user_exercise_stats`, 8.2 `mv_user_weekly_volume`, 8. Query & View Analitik, 9. Strategi Retensi & Soft Delete (+1 more)

### Community 66 - "6. Tabel Pendukung"
Cohesion: 0.18
Nodes (11): 6.10 `jobs`, 6.1 `sessions` (sesi login persisten), 6.2 `verification_tokens` (verifikasi email + reset password), 6.3 `refresh_tokens` (untuk mobile), 6.4 `device_tokens` (stub notifikasi), 6.5 `audit_logs`, 6.6 `notifications` (in-app), 6.7 `feature_flags` (+3 more)

### Community 67 - "10. Non-Functional Requirements"
Cohesion: 0.22
Nodes (9): 10.1 Performa, 10.2 Skala & Kapasitas, 10.3 Keamanan, 10.4 Privasi & Kepatuhan, 10.5 Aksesibilitas (WCAG 2.1 AA), 10.6 Observabilitas, 10.7 Kualitas & Testing, 10.8 Dokumentasi & Operasional (+1 more)

### Community 68 - "9. Spesifikasi AI"
Cohesion: 0.22
Nodes (9): 9.1 Model & Routing, 9.2 Prinsip Keamanan AI, 9.3 Budget Token & Biaya, 9.4 Pipeline Generate Program, 9.5 Aturan Validator Program (deterministik), 9.6 Rule Engine Rekomendasi, 9.7 Guardrail Output Coach, 9.8 Evaluasi Kualitas AI (+1 more)

### Community 69 - "phase4-e2e.mjs"
Cohesion: 0.52
Nodes (6): call(), main(), ok(), prisma, register(), stamp

### Community 70 - "@prisma/client"
Cohesion: 0.31
Nodes (8): call(), main(), ok(), prisma, register(), stamp, userA, userB

### Community 71 - "workouts-list.tsx"
Cohesion: 0.36
Nodes (5): dynamic, WorkoutsPage(), fmt(), Workout, WorkoutsList()

### Community 72 - "next.config.ts"
Cohesion: 0.29
Nodes (5): nextConfig, withNextIntl, EmptyState(), EmptyStateProps, EmptyStateWithAction()

### Community 73 - "3.1 Persona"
Cohesion: 0.25
Nodes (8): 3.1 Persona, 3.2 Use Case Utama, 3.3 Job-to-be-Done, 3. Persona & Use Cases, P1 — Pemula Konsisten ("Rani", 24 tahun), P2 — Intermediat Progresif ("Budi", 31 tahun), P3 — Pelatih & Konsultan ("Andra", 38 tahun), P4 — Power User Multi-Gym ("Agus", 45 tahun)

### Community 74 - "6. Arsitektur Teknis"
Cohesion: 0.25
Nodes (8): 6.1 Prinsip Arsitektur, 6.2 Tech Stack, 6.3 Diagram Arsitektur, 6.4 Struktur Direktori, 6.5 Alur Request Utama, 6.6 Strategi AI, 6.7 Roadmap ke Mobile, 6. Arsitektur Teknis

### Community 75 - "checks"
Cohesion: 0.08
Nodes (25): env, runs-on, services, steps, DATABASE_URL, POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER (+17 more)

### Community 76 - "5. Tabel AI"
Cohesion: 0.29
Nodes (7): feedback(), 5.1 `prompt_versions`, 5.2 `ai_generations` — Audit & Biaya, 5.3 `chat_threads`, 5.4 `chat_messages`, 5.5 `ai_recommendations`, 5. Tabel AI

### Community 77 - "3. Tabel Inti"
Cohesion: 0.33
Nodes (6): 3.1 `users` — Identitas & Preferensi, 3.2 `user_profiles` — Profil Latihan (1:1), 3.3 `entitlements` — Plan & Kuota, 3.5 `exercise_aliases` — Nama Alternatives, 3.6 `exercise_media` — Gambar/Video, 3. Tabel Inti

### Community 78 - "Rencana Implementasi GymApps v1"
Cohesion: 0.29
Nodes (7): 1. Baseline, 2. Blocker sebelum kode, 4. Protokol perubahan, 5. Sinyal peringatan dini, 6. Urutan kritis, Rencana Implementasi GymApps v1, Status implementasi per 2026-10-22

### Community 79 - "phase4-validation.ts"
Cohesion: 0.17
Nodes (15): DELETE, owned(), PATCH, runtime, POST, runtime, validateWorkout(), serializeNote() (+7 more)

### Community 80 - "Dokumentasi GymApps"
Cohesion: 0.33
Nodes (6): Dokumentasi GymApps, Dokumentasi Keudsaraan, Pertanyaan Terbuka, Peta Dokumen, Ringkasan Keputusan Produk, Urutan Pembacaan yang Disarankan

### Community 81 - "db/tsconfig.json"
Cohesion: 0.33
Nodes (5): compilerOptions, types, extends, include, ../../tsconfig.base.json

### Community 82 - "openapi.d.ts"
Cohesion: 0.29
Nodes (6): components, $defs, operations, paths, webhooks, WithRequired

### Community 83 - "shared/tsconfig.json"
Cohesion: 0.33
Nodes (5): compilerOptions, types, extends, include, ../../tsconfig.base.json

### Community 84 - "messages/route.ts"
Cohesion: 0.30
Nodes (9): ownedThread(), POST, runtime, streamResponse(), chatQuota(), detectLanguage(), guardrailTurn(), medicalGuardrail() (+1 more)

### Community 85 - "verification.ts"
Cohesion: 0.18
Nodes (10): hashToken(), TokenPurpose, TTL_MS, ARGON2_OPTIONS, DEFAULT_LOCALE, EMAIL_VERIFY_TTL_MS, LOCALES, PASSWORD_RESET_TTL_MS (+2 more)

### Community 86 - "web"
Cohesion: 0.05
Nodes (45): context, dockerfile, APP_BASE_URL, COM_ADOBE_TESTING_S3MOCK_STORE_INITIAL_BUCKETS, COM_ADOBE_TESTING_S3MOCK_STORE_RETAIN_FILES_ON_EXIT, COM_ADOBE_TESTING_S3MOCK_STORE_ROOT, DATABASE_URL, POSTGRES_DB (+37 more)

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

### Community 92 - "Components"
Cohesion: 0.11
Nodes (17): Border Radius, Buttons, Cards, Checkboxes, Chips, Colors, Components, Do's and Don'ts (+9 more)

### Community 93 - "SettingsPanel"
Cohesion: 0.24
Nodes (6): dynamic, SettingsPage(), SettingsPanel(), applyTheme(), savePreferences(), useRouter

### Community 94 - "rate-limit-store.ts"
Cohesion: 0.14
Nodes (12): clockStore(), policy, clockStore(), waitFor(), createDbRateLimitStore(), createMemoryRateLimitStore(), HitRow, MemoryEntry (+4 more)

### Community 95 - "workout-logger.tsx"
Cohesion: 0.23
Nodes (14): deltaLabel(), ExerciseCard(), submit(), fmt(), PreviousPerformance, Workout, WorkoutExercise, WorkoutSet (+6 more)

### Community 96 - "domain/tsconfig.json"
Cohesion: 0.50
Nodes (3): extends, include, ../../tsconfig.base.json

### Community 97 - "jobs/tsconfig.json"
Cohesion: 0.50
Nodes (3): extends, include, ../../tsconfig.base.json

### Community 101 - "5. Pipeline Program Generator"
Cohesion: 0.29
Nodes (7): 5.1 Tahapan, 5.2 Tool `emit_program`, 5.3 System Prompt — `program_generator` (v1), 5.4 System Prompt — `repair_pass` (v1), 5.5 Validator — Aturan V-01 … V-13, 5.6 Fallback Generator (Rule-based), 5. Pipeline Program Generator

### Community 103 - "Deploy (container)"
Cohesion: 0.22
Nodes (8): Build, Deploy (container), Env wajib di staging, Lokal dengan container, Menjalankan image di lokal, Migrasi, Rollback, Smoke test

### Community 104 - "6. Coach Chat"
Cohesion: 0.33
Nodes (6): 6.1 System Prompt — `coach_chat` (v1), 6.2 Tools Coach, 6.3 Format Respons Coach, 6.4 Streaming, 6.5 Deteksi Bahasa, 6. Coach Chat

### Community 105 - "profile/route.ts"
Cohesion: 0.48
Nodes (6): GET, PATCH, profileWithUser(), runtime, serializeProfile(), profileSchema

### Community 106 - "parseJson"
Cohesion: 0.10
Nodes (29): POST, runtime, DELETE, PATCH, runtime, POST, runtime, POST (+21 more)

### Community 107 - "phase8-backup.mjs"
Cohesion: 0.25
Nodes (7): compose, counts(), docker(), main(), prisma, root, createPrisma()

### Community 108 - "one-rm/route.ts"
Cohesion: 0.50
Nodes (4): GET, runtime, analyticsOneRm(), analyticsOneRmSchema

### Community 109 - "WorkoutLogger"
Cohesion: 0.20
Nodes (3): dynamic, WorkoutPage(), WorkoutLogger()

### Community 110 - "volume/route.ts"
Cohesion: 0.50
Nodes (3): GET, runtime, analyticsVolumeSchema

### Community 111 - "ai-program-generator.tsx"
Cohesion: 0.21
Nodes (12): AiProgramGenerator(), changeSplit(), poll(), submit(), dayRange(), GOALS, Job, Props (+4 more)

### Community 112 - "personal-records/route.ts"
Cohesion: 0.50
Nodes (4): GET, runtime, analyticsPersonalRecords(), analyticsPrSchema

### Community 113 - "fallback-generator.ts"
Cohesion: 0.08
Nodes (34): EmitProgram, emitProgramSchema, exercise, NormalizedProgram, NormalizeInput, progression, session, week (+26 more)

### Community 114 - "summary/route.ts"
Cohesion: 0.50
Nodes (3): GET, runtime, analyticsRangeSchema

### Community 115 - "next-intl"
Cohesion: 0.12
Nodes (17): ForgotPasswordPage(), LoginPage(), RegisterPage(), ResetPasswordPage(), VerifyEmailPage(), PrivacyPage(), TermsPage(), ForgotPasswordForm() (+9 more)

### Community 116 - "2. Goals, Non-Goals, dan Success Metrics"
Cohesion: 0.50
Nodes (4): 2.1 Goals v1, 2.2 Non-Goals v1, 2.3 Success Metrics (North Star & Guardrail), 2. Goals, Non-Goals, dan Success Metrics

### Community 117 - "4. Competitive Landscape & Positioning"
Cohesion: 0.50
Nodes (4): 4.1 Perbandingan Fitur, 4.2 Positioning Statement, 4.3 Prinsip Produk, 4. Competitive Landscape & Positioning

### Community 118 - "7. Model Data"
Cohesion: 0.50
Nodes (4): 7.1 ERD, 7.2 Entitas Utama, 7.3 Aturan Integritas Data, 7. Model Data

### Community 121 - "checkQuota"
Cohesion: 0.40
Nodes (4): checkQuota(), QuotaLimits, QuotaRemaining, QuotaResult

## Knowledge Gaps
- **8 isolated node(s):** `ADR-0004`, `ADR-0004`, `../../tsconfig.base.json`, `../../tsconfig.base.json`, `ADR-0002` (+3 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 840 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `handler.ts` to `web/package.json`, `prisma`, `orchestrator.ts`, `session.ts`, `workouts/route.ts`, `exports.ts`, `api/analytics.ts`, `register/route.ts`, `serializers.ts`, `onboarding/page.tsx`, `jobs.ts`, `onboarding-wizard.tsx`, `login/route.ts`, `v1/exercises/[exerciseId]/route.ts`, `programs-list.tsx`, `workout-logger.tsx`, `phase5-validation.ts`, `admin/exercises/route.ts`, `ApiError`, `clientIp`, `body-metrics/route.ts`, `getSession`, `dashboard-overview.tsx`, `[locale]/layout.tsx`, `exercise-library.tsx`, `workouts-list.tsx`, `next.config.ts`, `phase4-validation.ts`, `messages/route.ts`, `SettingsPanel`, `workout-logger.tsx`, `profile/route.ts`, `parseJson`, `one-rm/route.ts`, `volume/route.ts`, `ai-program-generator.tsx`, `personal-records/route.ts`, `summary/route.ts`, `next-intl`?**
  _High betweenness centrality (0.142) - this node is a cross-community bridge._
- **What connects `ADR-0004`, `ADR-0004`, `../../tsconfig.base.json` to the rest of the system?**
  _8 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `handler.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08205128205128205 - nodes in this community are weakly interconnected._
- **Why does `Product Requirements Document — GymApps v1.0 (Beta)` connect `Product Requirements Document — GymApps v1.0 (Beta)` to `5. Epics, User Stories & Prioritas`, `10. Non-Functional Requirements`, `9. Spesifikasi AI`, `8. Spesifikasi API`, `3.1 Persona`, `6. Arsitektur Teknis`, `2. Goals, Non-Goals, dan Success Metrics`, `estimateOneRm`, `4. Competitive Landscape & Positioning`, `plan.md`, `14. Roadmap`, `1. Ringkasan Eksekutif / Executive Summary`, `7. Model Data`, `Lampiran B — Deskripsi Wireframe (Low-fidelity)`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Should `chat.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Should `web/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.055272108843537414 - nodes in this community are weakly interconnected._
- **Should `prisma` be split into smaller, more focused modules?**
  _Cohesion score 0.07307692307692308 - nodes in this community are weakly interconnected._