# Deploy (container)

Image berisi Next.js standalone (`output: "standalone"`) + Chromium sistem untuk PDF bulanan. Worker queue ikut hidup di proses yang sama (`src/instrumentation.ts`), jadi **jalankan satu replika saja** selama queue masih in-process — dengan beberapa replika klaim `FOR UPDATE SKIP LOCKED` tetap aman, hanya poll-nya berlipat.

## Build

Context harus root repo (npm workspaces):

```bash
docker build -f apps/web/Dockerfile -t registry.example.com/gymapps:$(git rev-parse --short HEAD) .
docker push registry.example.com/gymapps:$(git rev-parse --short HEAD)
```

## Env wajib di staging

| Var | Catatan |
|---|---|
| `DATABASE_URL` | Postgres terkelola; `?schema=public` |
| `AUTH_SECRET` | 32+ byte acak, jangan pakai nilai dev |
| `EXPORT_SIGNING_SECRET` | kunci HMAC link download |
| `APP_BASE_URL` | URL publik staging (dipakai link verifikasi/reset) |
| `S3_BUCKET`, `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | object storage export/PDF; tanpa `S3_BUCKET` file jatuh ke disk container dan hilang saat redeploy |
| `EMAIL_API_KEY`, `EMAIL_FROM` | Resend-compatible |
| `POSTHOG_API_KEY` | default host `https://us.i.posthog.com` |
| `TRUST_PROXY_HEADERS` | `true` hanya di belakang reverse proxy yang menimpa `X-Forwarded-For` |

`CHROME_PATH=/usr/bin/chromium` dan `EXPORT_DIR=/data/exports` sudah diset di image.

## Migrasi

Migration tidak dijalankan otomatis saat start. Jalankan sebagai job satu kali per rilis, **sebelum** image baru menerima trafik:

```bash
DATABASE_URL=... npm run db:migrate:deploy -w @gymapps/db
```

## Smoke test

```bash
curl -fsS https://staging.example.com/api/v1/health   # {"status":"ok",...}
```

Lalu cek: register → email verifikasi masuk → login → buat export (file muncul di bucket) → unduh lewat link HMAC.

## Rollback

Image lama tetap di registry: deploy ulang tag sebelumnya. Migrasi tidak di-rollback otomatis — pastikan perubahan schema bersifat aditif (semua migrasi saat ini aditif) sebelum rilis.

## Lokal dengan container

```bash
docker compose -f infra/docker-compose.yml up -d postgres minio
docker compose -f infra/docker-compose.yml run --rm minio-init   # buat bucket
docker compose -f infra/docker-compose.yml --profile app up -d --build web
```

Console MinIO: http://localhost:9001 (`gymapps` / `gymapps123`).

> Catatan: `apps/web/Dockerfile` dan compose di atas belum pernah dibangun di mesin ini (Docker daemon tidak tersedia saat ditulis). Verifikasi pertama kali saat daemon jalan: `docker build -f apps/web/Dockerfile .`
