# GymApps

Workout tracker + AI coach. Next.js fullstack, PostgreSQL, Prisma.

## Phase 1 (Fondasi)

Monorepo `apps/web` + `packages/{db,shared,jobs,domain}` + `infra`.

### Setup

```bash
cp .env.example packages/db/.env
cp .env.example apps/web/.env.local
npm install
npm run gen:api
npm run db:generate
docker compose -f infra/docker-compose.yml up -d
npm run db:migrate
npm run db:seed
npm run dev
```

Open http://localhost:3000 — redirects to `/id`.

### Gates

| Gate | Command |
|---|---|
| Install clean | `npm ci` |
| Lint + typecheck | `npm run lint && npm run typecheck` |
| Unit checks | `npm test` (web 10, domain 27) |
| Build | `npm run build` |
| Migration from empty DB | `npm run db:migrate` |
| Seed idempotent | `npm run db:seed` twice, counts stay 20 muscles / 15 equipment / 200 exercises |
| Auth flow | register → `/api/v1/auth/me` 200; logout-all revokes both devices |
| Rate limit | 5 failed logins → 6th returns 429 |
| Health | `GET /api/v1/health` |

### Phase 3 (Data & API inti)

Routes: `/exercises`, `/muscles`, `/equipment`, `/programs`, `/workouts`. Includes custom exercise ownership, program activate/duplicate/archive, workout start/log/finish, PR append-only, cursor pagination, and `Idempotency-Key` on set creation.

```bash
npm run build
PORT=3100 npm start -w @gymapps/web
# terminal lain
BASE_URL=http://localhost:3100/api/v1 npm run test:phase3
```

Gate integration memeriksa volume 3 set, retry PR tanpa duplikasi, dua program aktif ditolak DB, resource user lain 403, dan auto-abandoned > 24 jam.

### Phase 4 (UI loop utama)

UI: onboarding 5 langkah, exercise library/picker dengan filter peralatan, workout logger (prefill set terakhir, delta, toggle set, rest timer, ringkasan), program builder/aktivasi/progres, dashboard analytics + kalender, body metrics + notes.

```bash
npm run build
PORT=3100 npm start -w @gymapps/web
# terminal lain
BASE_URL=http://localhost:3100/api/v1 npm run test:phase4
```

Gate E2E memeriksa onboarding, `available_only`, program aktif, 3 set → finish, previous performance + delta, summary/volume/PR/muscle/adherence/one-RM/calendar, body metric upsert per tanggal, notes CRUD, akses lintas user 403, dan dashboard 200.

### Phase 5 (AI program generator)

UI/API: generate + regenerate program, polling job, preview `draft`, badge AI, rationale, assumptions, safety notes, dan banner fallback. AI memakai OpenCode Go (OpenAI-compatible) lewat env; tanpa `OPENCODE_GO_API_KEY`/model fitur AI mengembalikan 503 `AI_UNAVAILABLE`.

```bash
cp apps/web/.env.example apps/web/.env.local   # isi env AI
npm run db:migrate
npm run db:seed
npm run test:phase5                            # self-contained: mock AI + Next dev
```

Gate E2E memeriksa bodyweight-only + cedera lutut, konteks tanpa PII, biaya token tercatat, retry 429, timeout, JSON invalid + repair 1×, fallback valid, regenerate 3 sesi/minggu, kuota 429, dan akses lintas user.

### Notes

- Phase 1 ships auth + master data; Phase 3 adds exercises, programs, workouts, sets, and PRs.
- Email verification and password reset are not in the Phase 1 deliverable list; email delivery lands with Phase 7.
- `Secure` cookie flag is enabled only in production so localhost works over http.
- Session cookie is refreshed on page navigation by `middleware.ts`, not only by API calls.
- Rate limits (login + write/heavy endpoints) are stored in Postgres (`rate_limits` table, atomic upsert); when the DB is unreachable they fall back to per-instance memory. Limits live in `packages/shared` (`LOGIN_RATE_LIMIT`, `API_RATE_LIMITS`). Login uses a fixed window of 15 minutes.
- `TRUST_PROXY_HEADERS` defaults to `false`, so spoofed `X-Forwarded-For` cannot change the rate-limit key. Set it to `true` only behind a reverse proxy that overwrites the header.
- Email verification + password reset send through a Resend-compatible REST API (`EMAIL_API_KEY`, `EMAIL_FROM`, optional `EMAIL_PROVIDER_BASE_URL`, `APP_BASE_URL`). Without `EMAIL_API_KEY` the feature is off: registration is auto-verified and the onboarding verification gate is skipped. Reset links are single-use and expire in 60 minutes (`FR-01-10`); verification links in 24 hours.
- Phase 2 domain modules live in `packages/domain` (no React, Next.js, Prisma, or DB).
- Phase 3 exercise search uses `ILIKE`; migrate to Postgres full-text when the catalog grows. Phase 4 implements `available_only` from the equipment profile.
- Resume an in-progress workout through `GET /workouts/active`; there is no separate resume mutation.
- AI program generation is asynchronous through Next.js `after()` and the `ai_generations` audit row; swap it for the queue in `packages/jobs` when a durable worker is available.
- The fallback generator is validated before persist. A structurally impossible request (for example bodyweight-only upper/lower with 2 days) fails the job instead of saving an invalid draft.
- `OPENCODE_GO_BASE_URL` should include `/v1`; model IDs and prices come from env, never hardcoded. Seed prompt versions are append-only and do not overwrite an existing active row.
- Sentry is intentionally not wired yet; errors go to structured logs (`apps/web/src/lib/log.ts`).

### Phase 6 (coach chat + rekomendasi)

UI/API: thread + pesan persisten, SSE (`meta`, `delta`, `tool`, `done`, `error`), tombol stop yang tetap menyimpan teks parsial, kartu exercise, sitasi sumber, feedback 👍/👎, kuota 30/jam + 200/hari. Enam tool read-only: `get_active_program`, `get_recent_workouts`, `get_personal_records`, `search_exercises`, `get_body_metrics`, `suggest_substitution`.

Guardrail medis deterministik berjalan sebelum LLM: tidak mendiagnosis, tidak meresepkan obat/dosis, mengarahkan ke dokter/fisioterapis. Kill-switch dicek dari env `AI_CHAT_ENABLED` dan flag DB `ai_chat`.

Rule engine berjalan setelah workout selesai (deload, adherence, imbalance, plateau, stale), menulis evidence + notifikasi. `PATCH /ai/recommendations/{id}` dengan `status: dismissed` memblokir rule yang sama selama 30 hari. Narasi memakai `OPENCODE_GO_MODEL_FAST`; template deterministik tetap tersimpan bila model gagal.

```bash
npm run test:phase6   # self-contained: mock chat SSE + Next dev
```

### Phase 7 (export, PDF, PWA, admin)

- Export CSV/JSON lewat `after()` job; file disimpan lewat `src/lib/storage.ts` — disk lokal `EXPORT_DIR` (default `<cwd>/.exports`) atau S3-compatible bila `S3_BUCKET` diset. Link HMAC 7 hari, wajib session + ownership. Link kedaluwarsa → 410 `EXPORT_EXPIRED`; akses user lain → 403.
- PDF bulanan memakai `playwright-core` + Chrome sistem (`CHROME_PATH`, default `/usr/bin/google-chrome`). Isi: ringkasan, grafik volume mingguan, PR, daftar workout, body metrics.
- PWA: `manifest.webmanifest`, icon 192/512 + maskable, service worker network-first untuk navigasi dan fallback `/offline.html`.
- Admin CMS `/{locale}/admin/exercises`: edit instruksi + publish langsung ke DB, tercatat di `audit_logs`; tidak perlu deploy.
- Notifikasi in-app untuk rekomendasi/export/report.

```bash
npm run test:phase7   # export, 410/403, PDF, admin publish, PWA
```

### Phase 8 (hardening)

```bash
npm run test:phase8   # build production + fase 3-7 E2E penuh
npm run test:load     # load test analytics p95 + metrik AI/WAU
npm run test:backup   # pg_dump -> restore ke DB scratch -> bandingkan jumlah baris
```

Hasil, review index, review PDP, dan blocker staging/beta ada di `docs/phase8-hardening.md`.

Catatan: PDF butuh Chrome terpasang. `OPENCODE_GO_PRICE_*` memakai USD per 1 juta token; isi `0` bila harga belum diketahui agar dashboard biaya tidak menyesatkan.
