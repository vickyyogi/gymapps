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
| Unit checks | `npm test` (web 6, domain 27) |
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

### Notes

- Phase 1 ships auth + master data; Phase 3 adds exercises, programs, workouts, sets, and PRs.
- Email verification and password reset are not in the Phase 1 deliverable list; email delivery lands with Phase 7.
- `Secure` cookie flag is enabled only in production so localhost works over http.
- Session cookie is refreshed on page navigation by `middleware.ts`, not only by API calls.
- Login rate limit is in-memory per instance until Redis is wired (Phase 4).
- `TRUST_PROXY_HEADERS` defaults to `false`, so spoofed `X-Forwarded-For` cannot change the rate-limit key. Set it to `true` only behind a reverse proxy that overwrites the header.
- Phase 2 domain modules live in `packages/domain` (no React, Next.js, Prisma, or DB).
- Phase 3 exercise search uses `ILIKE`; migrate to Postgres full-text when the catalog grows. Phase 4 implements `available_only` from the equipment profile.
- Resume an in-progress workout through `GET /workouts/active`; there is no separate resume mutation.
- Sentry is intentionally not wired yet; errors go to structured logs (`apps/web/src/lib/log.ts`).
