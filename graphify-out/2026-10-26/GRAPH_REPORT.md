# Graph Report - gymapps  (2026-10-26)

## Corpus Check
- 236 files · ~129,753 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: .example 3, (none) 1, .webmanifest 1)

## Summary
- 1726 nodes · 3734 edges · 122 communities (113 shown, 9 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5416e553`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- handler.ts
- client.ts
- web/package.json
- recommendations.ts
- scripts
- orchestrator.ts
- domain.test.ts
- Link
- phase6-serializers.ts
- session.ts
- AI Prompt Specification — GymApps v1
- ApiError
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
- db/src/index.ts
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
- parseJson
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
- checks
- 5. Tabel AI
- 3. Tabel Inti
- Rencana Implementasi GymApps v1
- chat.ts
- Dokumentasi GymApps
- db/tsconfig.json
- openapi.d.ts
- shared/tsconfig.json
- generateFallbackProgram
- dependencies
- 2. Goals, Non-Goals, dan Success Metrics
- 14. Roadmap
- 1. Ringkasan Eksekutif / Executive Summary
- 8. Spesifikasi API
- Lampiran B — Deskripsi Wireframe (Low-fidelity)
- Components
- postgres
- rate-limit-store.ts
- workout-logger.tsx
- domain/tsconfig.json
- jobs/tsconfig.json
- postcss.config.mjs
- sw.js
- SettingsPanel
- theme-toggle.tsx
- reports.ts
- messages/route.ts
- phase5-validation.ts
- phase8-backup.mjs
- one-rm/route.ts
- WorkoutLogger
- middleware.ts
- scripts
- account-retention.ts
- mock-chat-ai.mjs
- personal-records/route.ts
- register-form.tsx
- checkQuota
- 4. Competitive Landscape & Positioning
- 7. Model Data
- AGENTS.md
- web/AGENTS.md
- @gymapps/shared@*

## God Nodes (most connected - your core abstractions)
1. `ApiError` - 93 edges
2. `next` - 86 edges
3. `parseJson()` - 67 edges
4. `prisma` - 62 edges
5. `withAuthApi()` - 59 edges
6. `newId()` - 53 edges
7. `next-intl` - 40 edges
8. `parseQuery()` - 36 edges
9. `clientIp()` - 33 edges
10. `writeAudit()` - 26 edges

## Surprising Connections (you probably didn't know these)
- `Index review query panas` --references--> `analyticsVolume()`  [INFERRED]
  docs/phase8-hardening.md → apps/web/src/lib/api/analytics.ts
- `5.4 `chat_messages`` --references--> `feedback()`  [INFERRED]
  docs/data-model.md → apps/web/src/components/phase6/coach-chat.tsx
- `Review PDP / privacy` --references--> `purgeExpiredAccounts()`  [INFERRED]
  docs/phase8-hardening.md → apps/web/src/lib/account-retention.ts
- `8. Post-Processing & Moderasi` --references--> `context()`  [INFERRED]
  docs/ai/prompt-spec.md → packages/domain/src/domain.test.ts
- `12.1 Daftar Event (PostHog)` --references--> `valid()`  [INFERRED]
  docs/PRD.md → packages/domain/src/stats/one-rm.ts

## Import Cycles
- None detected.

## Communities (122 total, 9 thin omitted)

### Community 0 - "handler.ts"
Cohesion: 0.07
Nodes (37): DELETE, ownedThread(), runtime, runtime, STEPS, PATCH, runtime, GET (+29 more)

### Community 1 - "client.ts"
Cohesion: 0.16
Nodes (18): AiClientError, AiErrorCode, CallInput, callProgramModel(), CallResult, computeCostUsd(), emitProgramTool, endpoint() (+10 more)

### Community 2 - "web/package.json"
Cohesion: 0.15
Nodes (18): devDependencies, tailwindcss@^4.3.3, @tailwindcss/postcss@^4.3.3, @types/node@^22.20.5, @types/react@^19.2.18, @types/react-dom@^19.2.3, typescript@^5.9.3, vitest@^5.0.5 (+10 more)

### Community 3 - "recommendations.ts"
Cohesion: 0.18
Nodes (17): Candidate, candidatesFor(), evaluateRecommendationsForUser(), isoDate(), PULL, PUSH, SEVERITY_ORDER, startOfWeek() (+9 more)

### Community 4 - "scripts"
Cohesion: 0.06
Nodes (36): compat, config, devDependencies, eslint@^9.39.5, eslint-config-next@^15.5.28, @eslint/eslintrc@^3.3.1, typescript@^5.9.3, engines (+28 more)

### Community 5 - "orchestrator.ts"
Cohesion: 0.17
Nodes (18): GET, runtime, asMetadata(), completenessIssues(), failJob(), GOAL_LABEL, JobMetadata, jobResponse() (+10 more)

### Community 6 - "domain.test.ts"
Cohesion: 0.13
Nodes (14): 8. Post-Processing & Moderasi, BIG_MUSCLES, catalog(), context(), generated(), input(), GenerateProgramInput, PlannedSession (+6 more)

### Community 7 - "Link"
Cohesion: 0.23
Nodes (12): PrivacyPage(), TermsPage(), ICONS, NavLinks(), SidebarBody(), LocaleSwitcher(), LogoutButton(), getPathname (+4 more)

### Community 8 - "phase6-serializers.ts"
Cohesion: 0.15
Nodes (7): GET, runtime, SEVERITY_ORDER, serializeMessage(), serializeRecommendation(), serializeThread(), recommendationListSchema

### Community 9 - "session.ts"
Cohesion: 0.22
Nodes (10): POST, runtime, POST, runtime, clearSessionCookie(), createSession(), hashToken(), revokeAllSessions() (+2 more)

### Community 10 - "AI Prompt Specification — GymApps v1"
Cohesion: 0.06
Nodes (31): 10.1 Kasus Otomatis (CI, 20 kasus), 10.2 Kasus Manual (50 kasus, review mingguan), 10.3 Red-Team Set (30 prompt, wajib 0 violation), 10. Eval Set, 11. Monitoring & Biaya, 12. Fallback & Kill-Switch, 1. Prinsip, 2. Model & Konfigurasi (+23 more)

### Community 11 - "ApiError"
Cohesion: 0.12
Nodes (39): POST, POST, runtime, POST, runtime, DELETE, PATCH, runtime (+31 more)

### Community 12 - "exports.ts"
Cohesion: 0.13
Nodes (23): DELETE, GET, ownedExport(), runtime, GET, POST, runtime, GET (+15 more)

### Community 13 - "db/package.json"
Cohesion: 0.06
Nodes (43): dependencies, dotenv@^17.4.2, @prisma/adapter-pg@^7.10.1, @prisma/client@^7.10.1, ulid@^3.0.2, devDependencies, prisma@^7.10.1, tsx@^4.23.15 (+35 more)

### Community 14 - "analytics.ts"
Cohesion: 0.18
Nodes (14): GET, runtime, GET, runtime, analyticsAdherence(), analyticsCalendar(), AnalyticsRange, analyticsSummary() (+6 more)

### Community 15 - "register/route.ts"
Cohesion: 0.27
Nodes (8): GET, runtime, POST, runtime, hashPassword(), getEntitlement(), toCurrentUser(), ARGON2_OPTIONS

### Community 16 - "context.ts"
Cohesion: 0.27
Nodes (9): BODY_AREAS, bodyArea(), buildProgramContext(), ContextArrayKey, estimateTokens(), fitContext(), hashContext(), MAX_CONTEXT_TOKENS (+1 more)

### Community 17 - "[programId]/route.ts"
Cohesion: 0.15
Nodes (25): GET, PATCH, profileWithUser(), runtime, POST, runtime, DELETE, GET (+17 more)

### Community 18 - "fallback-generator.ts"
Cohesion: 0.10
Nodes (35): BALANCE_MUSCLES, broPlans(), DayPlan, ExerciseMetaMap, FULL_BODY_MUSCLES, LINEAR, LOWER_MUSCLES, plansFor() (+27 more)

### Community 19 - "auth.ts"
Cohesion: 0.11
Nodes (19): birthDateSchema, ChangePasswordInput, ChangePasswordRequest, changePasswordSchema, DeleteAccountInput, DeleteAccountRequest, deleteAccountSchema, email (+11 more)

### Community 20 - "parseQuery"
Cohesion: 0.36
Nodes (11): GET, GET, GET, GET, GET, GET, parseQuery(), decodeCursor() (+3 more)

### Community 21 - "onboarding-wizard.tsx"
Cohesion: 0.16
Nodes (11): dynamic, OnboardingPage(), ClassNames(), EQUIPMENT, Form, GOALS, INITIAL, INJURIES (+3 more)

### Community 22 - "domain/src/index.ts"
Cohesion: 0.12
Nodes (17): ADR-0002, AdherenceDropInput, DeloadInput, FrequencyLowInput, ImbalanceInput, MissingEquipmentInput, ProgramExerciseEquipment, OvertrainingRiskInput (+9 more)

### Community 23 - "login/route.ts"
Cohesion: 0.34
Nodes (11): POST, runtime, rateLimitHeaders(), verifyPassword(), checkLoginRateLimit(), clearLoginRateLimit(), loginRateLimitKey(), recordLoginFailure() (+3 more)

### Community 24 - "serializers.ts"
Cohesion: 0.11
Nodes (24): GET, runtime, POST, runtime, detail(), GET, PATCH, runtime (+16 more)

### Community 25 - "programs-list.tsx"
Cohesion: 0.13
Nodes (19): dynamic, ProgramsPage(), GOALS, Program, ProgramsList(), activate(), archive(), load() (+11 more)

### Community 26 - "db/src/index.ts"
Cohesion: 0.06
Nodes (5): PATCH, runtime, GET, runtime, serializeNotification()

### Community 27 - "workout-logger.tsx"
Cohesion: 0.13
Nodes (11): dynamic, ProgramPage(), EQUIPMENT, ExercisePicker(), MUSCLES, PickedExercise, Program, ProgramBuilder() (+3 more)

### Community 28 - "shared/package.json"
Cohesion: 0.12
Nodes (19): dependencies, vitest@5.0.5, zod@^4.6.7, devDependencies, openapi-typescript@^7.13.0, typescript@^5.9.3, typescript, vitest (+11 more)

### Community 29 - "threads/route.ts"
Cohesion: 0.17
Nodes (11): exerciseAdminListSchema, exerciseAdminUpdateSchema, exportCreateSchema, feedbackSchema, messageListSchema, messageSendSchema, notificationListSchema, recommendationUpdateSchema (+3 more)

### Community 30 - "phase3-validation.ts"
Cohesion: 0.07
Nodes (34): PATCH, runtime, GET, POST, runtime, DELETE, findVisibleExercise(), GET (+26 more)

### Community 31 - "schema.ts"
Cohesion: 0.22
Nodes (8): EmitProgram, emitProgramSchema, exercise, NormalizedProgram, NormalizeInput, progression, session, week

### Community 32 - "phase8-backup.mjs"
Cohesion: 0.21
Nodes (7): EP-05 — Cardio Logging (Prioritas: Should), buildId, main(), root, run(), stop(), waitFor()

### Community 33 - "5. Epics, User Stories & Prioritas"
Cohesion: 0.13
Nodes (15): 5.1 Ringkasan Epik, 5. Epics, User Stories & Prioritas, EP-01 — Authentication & Account, EP-02 — Onboarding & User Profile, EP-03 — Exercise Library, EP-04 — Workout Logging (Strength), EP-06 — Manual Program Builder & Templates, EP-07 — AI Program Generator (+7 more)

### Community 34 - "phase5-e2e.mjs"
Cohesion: 0.25
Nodes (15): assertBodyweightKneeSafe(), assertSessionCount(), call(), children, generate(), main(), ok(), prisma (+7 more)

### Community 35 - "adherence/route.ts"
Cohesion: 0.40
Nodes (5): GET, runtime, analyticsMuscleBalance(), muscleSets(), analyticsWeeksSchema

### Community 36 - "react"
Cohesion: 0.21
Nodes (11): AppLayout(), dynamic, AppSidebar(), NavItem, Notification, NotificationBell(), load(), openNotification() (+3 more)

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

### Community 45 - "body-metrics/route.ts"
Cohesion: 0.12
Nodes (17): DELETE, owned(), PATCH, runtime, GET, POST, runtime, DELETE (+9 more)

### Community 46 - "4. Program & Latihan"
Cohesion: 0.15
Nodes (13): 4.10 `notes`, 4.11 `workout_templates`, 4.12 `workout_template_exercises`, 4.1 `programs`, 4.2 `program_weeks`, 4.3 `program_sessions`, 4.4 `program_exercises`, 4.5 `workouts` — Sesi Tercatat (+5 more)

### Community 47 - "parseJson"
Cohesion: 0.15
Nodes (20): DELETE, runtime, ADR-0004, POST, runtime, POST, runtime, POST (+12 more)

### Community 48 - "phase4-validation.ts"
Cohesion: 0.14
Nodes (13): GET, runtime, analyticsRangeSchema, bodyMetricListSchema, bodyMetricSchema, bodyMetricUpdateSchema, EQUIPMENT, GOALS (+5 more)

### Community 49 - "shared/src/index.ts"
Cohesion: 0.48
Nodes (3): AuthSession, CurrentUser, ErrorResponse

### Community 50 - "getSession"
Cohesion: 0.26
Nodes (10): AdminExercisesPage(), dynamic, AdminExerciseEditor(), load(), save(), select(), Exercise, formFrom() (+2 more)

### Community 51 - "dashboard-overview.tsx"
Cohesion: 0.21
Nodes (11): DashboardPage(), dynamic, ActiveWorkout, Calendar, DashboardOverview(), fmt(), Profile, Program (+3 more)

### Community 52 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, allowJs, incremental, jsx, lib, paths, plugins, exclude (+3 more)

### Community 53 - "estimateOneRm"
Cohesion: 0.16
Nodes (16): 12.1 Daftar Event (PostHog), 12.2 Funnel Aktivasi, 12.3 Metrik AI, 12. Analytics, Funnel & KPIs, brzyckiOneRm(), epleyOneRm(), estimateOneRm(), ONE_RM_MAX_REPS (+8 more)

### Community 54 - "Phase 1 (Fondasi)"
Cohesion: 0.17
Nodes (11): Gates, GymApps, Notes, Phase 1 (Fondasi), Phase 3 (Data & API inti), Phase 4 (UI loop utama), Phase 5 (AI program generator), Phase 6 (coach chat + rekomendasi) (+3 more)

### Community 55 - "ExportsPanel"
Cohesion: 0.25
Nodes (6): dynamic, ExportsPage(), currentMonth(), ExportRow, ExportsPanel(), size()

### Community 56 - "Product Requirements Document — GymApps v1.0 (Beta)"
Cohesion: 0.18
Nodes (11): 11. Acceptance Criteria Konsolidasi (Ringkasan), 13.1 Model, 13.2 Alur Monetisasi Mendatang, 13.3 Yang Diprioritaskan Saat Monetisasi, 13. Monetisasi (Rencana, Implementasi v1.2), 15. Risiko & Mitigasi, 16. Pertanyaan Terbuka (Open Questions), Daftar Isi (+3 more)

### Community 57 - "jobs/package.json"
Cohesion: 0.20
Nodes (10): devDependencies, typescript@^5.9.3, typescript, main, name, private, scripts, typecheck (+2 more)

### Community 58 - "next-intl"
Cohesion: 0.14
Nodes (9): nextConfig, withNextIntl, LayoutProps, viewport, EmptyState(), EmptyStateProps, EmptyStateWithAction(), routing (+1 more)

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
Cohesion: 0.14
Nodes (11): dynamic, ExercisesPage(), DIFFICULTY, EQUIPMENT_LIST, Exercise, ExerciseDetail, ExerciseLibrary(), openDetail() (+3 more)

### Community 65 - "Data Model — GymApps v1"
Cohesion: 0.22
Nodes (9): 10. Migrasi, 1. Konvensi, 2. ERD, 7. Enum, 8.1 `mv_user_exercise_stats`, 8.2 `mv_user_weekly_volume`, 8. Query & View Analitik, 9. Strategi Retensi & Soft Delete (+1 more)

### Community 66 - "6. Tabel Pendukung"
Cohesion: 0.20
Nodes (10): 6.1 `sessions` (sesi login persisten), 6.2 `verification_tokens` (reset password), 6.3 `refresh_tokens` (untuk mobile), 6.4 `device_tokens` (stub notifikasi), 6.5 `audit_logs`, 6.6 `notifications` (in-app), 6.7 `feature_flags`, 6.8 `exports` (+2 more)

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

### Community 72 - "Fase 8 — Hardening & Beta"
Cohesion: 0.25
Nodes (7): Audit log, Blocker eksternal staging & beta, Blocking sebelum gate Fase 8 penuh, Fase 8 — Hardening & Beta, Hasil gate (2026-10-23), Index review query panas, Perintah

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

### Community 79 - "chat.ts"
Cohesion: 0.13
Nodes (18): buildChatContext(), CHAT_MAX_CONTEXT_TOKENS, ChatCard, ChatCitation, ChatSend, ChatTurnInput, dayIndex(), endpoint() (+10 more)

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

### Community 84 - "generateFallbackProgram"
Cohesion: 0.22
Nodes (10): balanceWeek(), estimatedSeconds(), estimateSecond(), generateFallbackProgram(), scheduleFor(), contextFrom(), emitProgram(), json() (+2 more)

### Community 85 - "dependencies"
Cohesion: 0.11
Nodes (18): dependencies, @gymapps/db@*, @gymapps/domain@*, lucide-react@^1.61.0, next@^16.4.3, next-intl@^4.14.9, @node-rs/argon2@^2.2.2, @radix-ui/react-dialog@^1.3.1 (+10 more)

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

### Community 92 - "Components"
Cohesion: 0.11
Nodes (17): Border Radius, Buttons, Cards, Checkboxes, Chips, Colors, Components, Do's and Don'ts (+9 more)

### Community 93 - "postgres"
Cohesion: 0.11
Nodes (17): POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER, interval, retries, test, timeout, environment (+9 more)

### Community 94 - "rate-limit-store.ts"
Cohesion: 0.16
Nodes (11): clockStore(), policy, clockStore(), createDbRateLimitStore(), createMemoryRateLimitStore(), HitRow, MemoryEntry, memoryStore (+3 more)

### Community 95 - "workout-logger.tsx"
Cohesion: 0.23
Nodes (14): deltaLabel(), ExerciseCard(), submit(), fmt(), PreviousPerformance, Workout, WorkoutExercise, WorkoutSet (+6 more)

### Community 96 - "domain/tsconfig.json"
Cohesion: 0.50
Nodes (3): extends, include, ../../tsconfig.base.json

### Community 97 - "jobs/tsconfig.json"
Cohesion: 0.50
Nodes (3): extends, include, ../../tsconfig.base.json

### Community 101 - "SettingsPanel"
Cohesion: 0.17
Nodes (8): dynamic, SettingsPage(), LoginPage(), LoginForm(), SettingsPanel(), applyTheme(), savePreferences(), useRouter

### Community 103 - "theme-toggle.tsx"
Cohesion: 0.17
Nodes (10): AuthLayout(), ProfileData, TIMEZONES, Theme, THEMES, ThemeToggle(), DesignTokens, THEME_STORAGE_KEY (+2 more)

### Community 104 - "reports.ts"
Cohesion: 0.22
Nodes (11): playwright-core@^1.64.1, server-only@^0.0.1, chartSvg(), escapeHtml(), exportDir(), isoDate(), monthRange(), runReport() (+3 more)

### Community 105 - "messages/route.ts"
Cohesion: 0.29
Nodes (11): ownedThread(), POST, runtime, streamResponse(), chatQuota(), detectLanguage(), guardrailTurn(), medicalGuardrail() (+3 more)

### Community 106 - "phase5-validation.ts"
Cohesion: 0.18
Nodes (11): POST, POST, runtime, createProgramGenerationJob(), EQUIPMENT, generateShapeError(), GOALS, MUSCLES (+3 more)

### Community 107 - "phase8-backup.mjs"
Cohesion: 0.21
Nodes (7): compose, counts(), docker(), main(), prisma, root, createPrisma()

### Community 108 - "one-rm/route.ts"
Cohesion: 0.22
Nodes (9): GET, runtime, GET, runtime, analyticsOneRm(), analyticsVolume(), rangeStart(), analyticsOneRmSchema (+1 more)

### Community 109 - "WorkoutLogger"
Cohesion: 0.20
Nodes (3): dynamic, WorkoutPage(), WorkoutLogger()

### Community 110 - "middleware.ts"
Cohesion: 0.31
Nodes (8): attachSessionCookie(), cookieOptions(), APP_SEGMENTS, config, intlMiddleware, middleware(), SESSION_COOKIE_NAME, SESSION_TTL_SECONDS

### Community 111 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, start, test, typecheck

### Community 112 - "account-retention.ts"
Cohesion: 0.40
Nodes (5): ACCOUNT_RETENTION_DAYS, purgeExpiredAccounts(), ADR-0004, deleteExportFile(), Review PDP / privacy

### Community 113 - "mock-chat-ai.mjs"
Cohesion: 0.47
Nodes (4): json(), requests, server, sseChunk()

### Community 114 - "personal-records/route.ts"
Cohesion: 0.50
Nodes (4): GET, runtime, analyticsPersonalRecords(), analyticsPrSchema

### Community 116 - "checkQuota"
Cohesion: 0.40
Nodes (4): checkQuota(), QuotaLimits, QuotaRemaining, QuotaResult

### Community 117 - "4. Competitive Landscape & Positioning"
Cohesion: 0.50
Nodes (4): 4.1 Perbandingan Fitur, 4.2 Positioning Statement, 4.3 Prinsip Produk, 4. Competitive Landscape & Positioning

### Community 118 - "7. Model Data"
Cohesion: 0.50
Nodes (4): 7.1 ERD, 7.2 Entitas Utama, 7.3 Aturan Integritas Data, 7. Model Data

## Knowledge Gaps
- **8 isolated node(s):** `ADR-0004`, `ADR-0004`, `../../tsconfig.base.json`, `../../tsconfig.base.json`, `ADR-0002` (+3 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 786 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `handler.ts` to `web/package.json`, `orchestrator.ts`, `phase6-serializers.ts`, `session.ts`, `ApiError`, `exports.ts`, `analytics.ts`, `register/route.ts`, `[programId]/route.ts`, `onboarding-wizard.tsx`, `login/route.ts`, `serializers.ts`, `programs-list.tsx`, `db/src/index.ts`, `workout-logger.tsx`, `phase3-validation.ts`, `adherence/route.ts`, `react`, `body-metrics/route.ts`, `parseJson`, `phase4-validation.ts`, `getSession`, `dashboard-overview.tsx`, `next-intl`, `exercise-library.tsx`, `workouts-list.tsx`, `dependencies`, `workout-logger.tsx`, `SettingsPanel`, `theme-toggle.tsx`, `messages/route.ts`, `phase5-validation.ts`, `one-rm/route.ts`, `middleware.ts`, `personal-records/route.ts`, `register-form.tsx`?**
  _High betweenness centrality (0.152) - this node is a cross-community bridge._
- **What connects `ADR-0004`, `ADR-0004`, `../../tsconfig.base.json` to the rest of the system?**
  _8 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `handler.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06561085972850679 - nodes in this community are weakly interconnected._
- **Why does `Product Requirements Document — GymApps v1.0 (Beta)` connect `Product Requirements Document — GymApps v1.0 (Beta)` to `5. Epics, User Stories & Prioritas`, `10. Non-Functional Requirements`, `9. Spesifikasi AI`, `8. Spesifikasi API`, `3.1 Persona`, `6. Arsitektur Teknis`, `Lampiran B — Deskripsi Wireframe (Low-fidelity)`, `estimateOneRm`, `2. Goals, Non-Goals, dan Success Metrics`, `plan.md`, `14. Roadmap`, `1. Ringkasan Eksekutif / Executive Summary`, `4. Competitive Landscape & Positioning`, `7. Model Data`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **Should `web/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.14619883040935672 - nodes in this community are weakly interconnected._
- **Should `scripts` be split into smaller, more focused modules?**
  _Cohesion score 0.05832147937411095 - nodes in this community are weakly interconnected._
- **Should `domain.test.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13450292397660818 - nodes in this community are weakly interconnected._