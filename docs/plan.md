# Rencana Implementasi GymApps v1

Turunan dari [`PRD.md`](./PRD.md), [`data-model.md`](./data-model.md), [`api/openapi.yaml`](./api/openapi.yaml), dan [`ai/prompt-spec.md`](./ai/prompt-spec.md).

Tujuan dokumen: urutan kerja + gate per fase, supaya perubahan kontrak, schema, prompt, dan domain terdeteksi sebelum menyebar ke kode lain.

---

## 1. Baseline

| Item | Status |
|---|---|
| Kode aplikasi | Belum ada; `gymapps/` hanya berisi `docs/` |
| Git root | `C:\Users\SER5 MAX\Documents\VICKY\javascript` — bercampur project lain |
| Node / npm | v22.21.0 / 10.9.4 |
| Docker / psql lokal | Tidak tersedia |
| Kontrak API | `docs/api/openapi.yaml` |
| Schema | `docs/data-model.md` |
| Prompt | `docs/ai/prompt-spec.md` |

Drift dokumen yang harus dibereskan di Fase 0:

- `PRD.md §8.2` belum memuat `/auth/token` dan `/health` yang ada di `openapi.yaml`.
- `PRD.md §7.1` menyebut entitas `Account`; `data-model.md` tidak memilikinya.

### Status implementasi per 2026-10-22

| Fase | Status |
|---|---|
| Fase 0 | Selesai untuk kode/dokumen: ADR 001–004 `Accepted`, drift PRD diperbaiki, kontrak tunggal `openapi.yaml` → tipe + Zod, CI skeleton ada, branch `main`/`develop` ada. Redis dan object storage belum diprovisikan; Sentry ditunda. |
| Fase 1 | Selesai: auth/master data/i18n/observability (structured log); lint, typecheck, test, build, migrasi, seed, dan auth E2E hijau. |
| Fase 2 | Selesai: `packages/domain`, 27 test tanpa DB/API. |
| Fase 3 | Selesai: exercise seed 200 + filter/pagination + custom owner; program manual/activate/duplicate/archive; workout quick/program, set + PR + agregat, finish, auto-abandoned >24 jam, `Idempotency-Key`, cursor + Zod. Search masih `ILIKE`; FTS ditunda. |
| Fase 4 | Selesai: profil/onboarding, `available_only`, logger dengan prefill + delta + rest timer + ringkasan, program builder, dashboard analytics, body metrics, notes. Gate E2E `scripts/phase4-e2e.mjs` hijau. |
| Fase 5 | Selesai: `prompt_versions` + `ai_generations`, context builder ≤5.000 token + redaksi PII, OpenCode Go client dengan retry/timeout, orchestrator quota → tool-use → validator → repair 1× → fallback, API job/status/regenerate, UI generate/regenerate + badge/rationale/banner. Gate E2E `scripts/phase5-e2e.mjs` hijau. |
| Fase 6 | Selesai: chat thread/message persist, SSE streaming + abort partial, 6 tools + sitasi, guardrail medis deterministik, deteksi bahasa, feedback, kuota 30/jam + 200/hari, kill-switch env + DB `ai_chat`, rule engine setelah finish workout, dismiss 30 hari, evidence + notifikasi. Gate E2E `scripts/phase6-e2e.mjs` hijau. |
| Fase 7 | Selesai: export CSV/JSON background + signed link 7 hari, PDF Playwright via Chrome sistem, PWA manifest/SW/offline, admin CMS exercise + audit log, notifikasi in-app. Gate E2E `scripts/phase7-e2e.mjs` hijau. |
| Fase 8 | Sebagian: E2E penuh (`scripts/phase8-e2e.mjs`), load test analytics p95 237 ms, index review + 2 index baru, backup/restore drill, review PDP, audit log profile/program/workout. Belum: staging deploy, beta 100 user, error rate/rollback otomatis, gate AI failure & biaya per WAU. Detail: [`phase8-hardening.md`](./phase8-hardening.md). |
| Eksternal | Belum diverifikasi: Docker (daemon tidak tersedia). Sentry tidak dipakai sementara. |

---

## 2. Blocker sebelum kode

| ID | Pertanyaan | Batas | ADR |
|---|---|---|---|
| Q-02 | Program AI: 8 minggu penuh atau 1 minggu yang di-roll? | Sebelum schema Prisma | [`decisions/ADR-001`](./decisions/ADR-001-program-shape.md) |
| Q-06 | Berapa lama program AI dianggap `stale`? | Sebelum rule engine | [`decisions/ADR-002`](./decisions/ADR-002-stale-program.md) |
| Q-08 | Retry Anthropic berapa kali sebelum fallback? | Sebelum AI layer | [`decisions/ADR-003`](./decisions/ADR-003-anthropic-retry.md) |
| Q-10 | Data user terhapus pada statistik agregat? | Sebelum job hard-delete | [`decisions/ADR-004`](./decisions/ADR-004-deleted-account-aggregates.md) |

Q-02 paling mahal. Salah pilih = migrasi `program_weeks` + rewrite context builder + validator.

---

## 3. Fase

Setiap fase punya gate. Fase berikutnya tidak dimulai sebelum gate fase sebelumnya hijau.

### Fase 0 — Pre-flight (1–3 hari)

1. Pindahkan `gymapps` ke repo sendiri; branch `main` + `develop`.
2. Putuskan Q-02, Q-06, Q-08, Q-10; isi ADR.
3. Tetapkan satu sumber kontrak: `openapi.yaml` → generator tipe/Zod. Tidak ada definisi kedua.
4. Siapkan environment: Postgres (hosted atau Docker), Redis, object storage, Opencode API, email, PostHog. Sentry ditunda.
5. Tulis CI skeleton: lint, typecheck, test, build.

**Gate:** semua ADR berstatus `Accepted`; CI jalan walau belum ada test; environment dev bisa connect DB.

### Fase 1 — Fondasi (Sprint 1–2)

| # | Deliverable | Gate |
|---|---|---|
| 1.1 | Monorepo: `apps/web`, `packages/db`, `packages/shared`, `packages/jobs`, `infra` | `npm install` bersih; lint + typecheck hijau |
| 1.2 | Prisma baseline + migrasi pertama | `prisma migrate dev` sukses dari DB kosong |
| 1.3 | Master `muscles`, `equipment` + enum | Seed idempotent, rerun tidak duplikat |
| 1.4 | Auth credentials: register, login, logout, logout-all, me, Argon2id, cookie session, sliding expiry | Login → `/auth/me` 200; session expired → 401; logout-all revoke 2 device |
| 1.5 | Middleware auth gate, error envelope, request ID, rate limit login | 5 login gagal → 429; route `(app)` redirect `?next=` |
| 1.6 | Shell i18n `/id` `/en`, layout, theme, empty state | Nol string user-facing hardcoded |
| 1.7 | Structured log + request ID, `/health` | Error buatan tercatat di log; health 200/503 |

### Fase 2 — Domain murni (paralel Sprint 2–3)

Bangun `domain/` dengan fixture; tanpa React, Next.js, Prisma, atau DB.

| Modul | Isi | Gate |
|---|---|---|
| `stats/one-rm` | Epley + Brzycki; reps > 12 tanpa estimasi | `AC-08-02` = 93.33 kg |
| `stats/volume` | Volume set; primary 1.0, secondary 0.5 | Fixture multi-otot benar |
| `stats/pr` | 4 tipe PR, historis, tidak overwrite | PR lama tetap ada |
| `stats/adherence` | Hari belum lewat bukan miss | Program 4 hari, 2 selesai → 50% |
| `program/validator` | V-01…V-13 | Satu test per aturan, termasuk input invalid |
| `program/fallback-generator` | Generator deterministik | Output selalu lolos validator |
| `rules/*` | Plateau, deload, imbalance, adherence drop, stale | `AC-10-01` lulus |
| `entitlements/quota` | Cek kuota murni | Batas harian/jam benar |

**Gate:** seluruh test domain lulus tanpa DB/API.

### Fase 3 — Data & API inti (Sprint 3–4) — selesai

Status: route exercise/program/workout/set, migrasi `20261022113721_phase3`, seed 200 exercise, dan gate integration test di `scripts/phase3-e2e.mjs`.

Urutan dependensi: exercise → program → workout → set.

1. Exercise library: seed 200, full-text search, filter equipment, custom exercise + constraint owner.
2. Program manual: weeks → sessions → exercises; partial unique `uniq_active_program`; activate, duplicate, archive.
3. Workout logging: start from program / quick, add exercise, record set dalam satu transaksi (set + PR + aggregate).
4. Finish workout: hitung volume, set, PR; trigger evaluasi rule (boleh stub).
5. Active/abandoned workout: auto `abandoned` > 24 jam, resume < 7 hari.
6. `Idempotency-Key` pada mutation kritikal; cursor pagination; validasi Zod server-side.

**Gate (integration test):**

- 3 set → `total_volume_kg` benar.
- Retry request yang sama → PR tidak dobel.
- Dua program aktif → ditolak DB.
- Resource user lain → 403.

Diverifikasi dengan server lokal: `BASE_URL=http://localhost:3100/api/v1 npm run test:phase3`.

### Fase 4 — UI loop utama (Sprint 4–5) — selesai

Status: UI `/onboarding`, `/dashboard`, `/workouts`, `/workouts/[id]`, `/programs`, `/programs/[id]`, `/exercises`, `/progress`; API `/profile`, `/analytics/*`, `/body-metrics`, `/notes`; migrasi `20261022115505_phase4`; gate `scripts/phase4-e2e.mjs`.

1. Onboarding 5 langkah + skip + banner perubahan goal.
2. Exercise picker + filter "hanya equipment saya".
3. Workout logger: prefill set terakhir, delta vs sesi lalu, toggle selesai, rest timer, ringkasan.
4. Program builder, aktivasi, progres minggu.
5. Dashboard: summary, volume, PR, muscle balance, adherence, kalender, insight bar.
6. Body metrics + notes.

**Gate:** logging ≤ 2 interaksi (`G-02`); E2E signup → onboarding → sesi → 3 set → finish → dashboard.

Diverifikasi dengan server lokal: `BASE_URL=http://localhost:3100/api/v1 npm run test:phase4`.

### Fase 5 — AI program generator (Sprint 7–8) — selesai

Status: migrasi `20261022121643_phase5_ai`, seed `program_generator` v1 + `repair_pass` v1, API `/ai/programs/generate`, `/ai/jobs/[jobId]`, `/ai/programs/[programId]/regenerate`, UI generate/regenerate di halaman program, dan gate `scripts/phase5-e2e.mjs`.

1. `prompt_versions` + seed prompt dari `ai/prompt-spec.md`.
2. `ai_generations` audit: status, token, biaya, latency, error_code, `fallback_used`, `retry_count`, `input_hash`.
3. Context builder ≤ 5.000 token + redaksi PII.
4. Orchestrator: quota → build → tool-use → validate → repair 1× → fallback.
5. Background job (`after()` + `ai_generations.metadata.job`) + endpoint status/progress.
6. Preview wajib review; program selalu `draft`; badge AI + rationale + banner fallback.

**Gate:** `AC-07-03`, `AC-07-04`, `AC-07-05`, `AC-07-07`; simulasi timeout/429/JSON invalid; fallback tetap menghasilkan program valid; biaya tercatat.

Diverifikasi dengan server + mock OpenCode Go: `npm run test:phase5`. Gate mencakup bodyweight-only + cedera lutut, retry 429, timeout 45s (dipercepat via `OPENCODE_GO_TIMEOUT_MS`), JSON invalid + repair 1×, fallback valid, biaya token > 0, regenerate tepat 3 sesi/minggu, kuota 429, dan akses lintas user 403/404.

### Fase 6 — Coach chat + rekomendasi (Sprint 9–10)

1. Thread/message persist; SSE streaming; abort menyimpan teks parsial.
2. Tools: `get_active_program`, `get_recent_workouts`, `get_personal_records`, `search_exercises`, `get_body_metrics`, `suggest_substitution`.
3. Guardrail medis, sitasi sumber, deteksi bahasa.
4. Feedback 👍/👎; rate limit 30/jam, 200/hari.
5. Rule engine event-driven setelah workout; narasi Haiku; dismiss 30 hari; evidence wajib.

**Gate:** `AC-09-03`, `AC-09-04`, `AC-09-07`, `AC-10-03`; red-team set 0 violation; kill-switch `ai_chat` memblokir panggilan LLM.

### Fase 7 — Sisa fitur (Sprint 11–12)

Body metrics chart, notes, export CSV/JSON background job, PDF Playwright, PWA/offline, admin CMS exercise, notifikasi in-app.

**Gate:** `AC-12-03` link kedaluwarsa; `AC-12-04` lintas user 403; PWA installable; admin publish tanpa deploy.

### Fase 8 — Hardening & beta (Sprint 13–14)

Status: sebagian selesai. E2E penuh, load test analytics, index review, backup/restore drill, review PDP, dan audit log profile/program/workout sudah ada. Sisa: deploy staging, beta 100 user, error rate < 0,5% dengan rollback otomatis, gate AI failure < 2% dan biaya ≤ USD 0,30/WAU. Detail perintah + hasil: [`phase8-hardening.md`](./phase8-hardening.md).

E2E penuh, load test analytics, review index query panas, audit log, backup/restore drill, review PDP, deploy staging, beta 100 user.

**Gate:** error rate < 0.5%, p95 analytics < 1 detik, AI failure < 2%, biaya ≤ USD 0.30/WAU, checklist Lampiran C selesai.

---

## 4. Protokol perubahan

| Perubahan | Aturan | Risiko yang dicegah |
|---|---|---|
| Endpoint/schema | Ubah `openapi.yaml` dulu → generate Zod/tipe → baru kode | Frontend/backend beda kontrak |
| Kolom/tabel | Expand → backfill → dual-write → contract; jangan drop/rename dalam satu release | Downtime, data hilang |
| Prompt AI | Versi baru di `prompt_versions`; jangan edit baris aktif; jalankan eval set | Perilaku berubah tanpa jejak |
| Formula/rule | Ubah fixture test bersamaan; PR terpisah | Analytics berubah diam-diam |
| Fitur berisiko | Feature flag sejak hari pertama | Rollback butuh deploy |
| Keputusan produk | ADR: konteks, opsi, keputusan, konsekuensi | Keputusan hilang di chat |
| Data user | Soft delete + audit log; hard delete hanya lewat job | Analytics rusak / tidak comply |

Sumber kebenaran: kontrak di `openapi.yaml`, logika di `domain/`, prompt di `prompt_versions`. Kode tidak boleh punya definisi kedua.

---

## 5. Sinyal peringatan dini

| Gejala | Artinya | Tindakan |
|---|---|---|
| Validator butuh query DB | Domain tidak murni | Pindahkan input ke parameter/fixture |
| UI tahu rumus volume/1RM | Logika bocor ke React | Pindahkan ke `domain/stats` |
| `program_weeks` berubah setelah AI mulai | Q-02 belum final | Hentikan AI; revisi schema + validator |
| Dua tempat hitung PR | Sumber kebenaran ganda | Satukan di write-path |
| Test AI flaky | Validator kurang ketat | Paksa tool-use JSON + schema ketat |
| Migrasi makin lama | Perubahan destruktif menumpuk | Pisahkan expand/contract per sprint |

---

## 6. Urutan kritis

`Q-02` → `schema + auth` → `domain murni + test` → `vertical slice logging` → `AI`.

AI terakhir bukan karena tidak penting, tapi karena kesalahan schema/domain di sana paling mahal untuk diperbaiki.
