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

### Menjalankan image di lokal

```bash
docker build -f apps/web/Dockerfile -t gymapps:local .
docker run --rm --network host -e PORT=3000 \
  -e DATABASE_URL='postgresql://gymapps:gymapps@localhost:5432/gymapps?schema=public' \
  gymapps:local
```

Dua jebakan yang sudah ketemu saat verifikasi:

- **`--env-file` tidak membuang tanda kutip.** `apps/web/.env.local` menulis `DATABASE_URL="postgresql://..."`, jadi container menerima URL yang mengandung `"` dan gagal connect (`Can't reach database server at base`). Pakai compose, atau lewati lewat `-e` seperti di atas.
- **`HOSTNAME` bocor dari host** saat `--network host`: server ikut bind ke nama host mesin, bukan `0.0.0.0`. Image sekarang menyetel `HOSTNAME=0.0.0.0`, jadi tidak perlu dioper manual.

Yang sudah diverifikasi pada image: `/api/v1/health` 200, halaman `/{locale}/login` 200, register → export queued→ready → unduh 200, report queued→ready → PDF 25 KB berawalan `%PDF-`, log container bersih. `playwright-core` sengaja di-`serverExternalPackages` dan disalin utuh ke image karena output tracing membuang `browsers.json`.

## Rollback

Image lama tetap di registry: deploy ulang tag sebelumnya. Migrasi tidak di-rollback otomatis — pastikan perubahan schema bersifat aditif (semua migrasi saat ini aditif) sebelum rilis.

## Lokal dengan container

```bash
docker compose -f infra/docker-compose.yml up -d postgres s3mock
docker compose -f infra/docker-compose.yml --profile app up -d --build web
```

Storage lokal memakai `adobe/s3mock` (port 9090, bucket `gymapps-exports` dibuat otomatis lewat `COM_ADOBE_TESTING_S3MOCK_STORE_INITIAL_BUCKETS`; nama variabel `initialBuckets` sudah tidak dipakai di s3mock 5.x) karena image MinIO tidak lagi dipublikasikan di Docker Hub/quay. Kredensial apa pun diterima; `S3_FORCE_PATH_STYLE` default `true` cocok untuk endpoint ini.

Uji jalur S3 tanpa compose:

```bash
docker run -d --name gymapps-s3 -p 9090:9090 \
  -e COM_ADOBE_TESTING_S3MOCK_STORE_INITIAL_BUCKETS=gymapps-exports adobe/s3mock
docker run --rm --network host -e PORT=3000 \
  -e DATABASE_URL='postgresql://gymapps:gymapps@localhost:5432/gymapps?schema=public' \
  -e S3_BUCKET=gymapps-exports -e S3_ENDPOINT=http://127.0.0.1:9090 -e S3_REGION=auto \
  -e S3_ACCESS_KEY_ID=test -e S3_SECRET_ACCESS_KEY=test gymapps:local
```

> Image sudah dibangun dan diuji manual (`docker build` + `docker run`), termasuk jalur S3 (export → objek `exports/<id>.csv` di bucket s3mock → unduh → hapus). Jalur compose/`--profile app` belum dijalankan.
