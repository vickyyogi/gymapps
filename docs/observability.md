# Observability

Dua lapis: structured log JSON (`src/lib/log.ts`, stdout) dan PostHog (`src/lib/analytics.ts`). Tanpa `POSTHOG_API_KEY` semua pengiriman jadi no-op, jadi dev lokal tidak perlu akun.

## Event yang dikirim

| Event | Kapan | Properties |
|---|---|---|
| `user_registered` | register sukses | `locale` |
| `app_opened` | login sukses (dasar DAU/WAU) | `via: "login"` |
| `workout_completed` | `POST /workouts/{id}/finish` | `total_sets`, `total_volume_kg`, `duration_seconds`, `prs_created` |
| `ai_generation_finished` | job program AI selesai/gagal | `status`, `model`, `cost_usd`, `latency_ms`, `input_tokens`, `output_tokens`, `fallback_used`, `repair_attempts`, `error_code` |
| `export_requested` / `report_requested` | request export/PDF diterima | `type`, `entities` / `month` |
| `quota_exceeded` | respons 429 (rate limit / kuota AI) | `code`, `path` |
| `job_failed` | job queue gagal setelah retry | `kind`, `attempts`, `retry` |
| `$exception` | error 500 API, error job, `onRequestError` | `source`, `route`/`request_id`, `$exception_list` |

`distinct_id` = user id internal (`usr_...`), bukan email. Jangan kirim email, nama, atau isi catatan/chat ke PostHog.

## Dashboard (NFR-OBS-05)

Buat di PostHog dari event di atas:

- DAU/WAU — unique `distinct_id` pada `app_opened`
- Workout per hari — count `workout_completed`
- Error rate — count `$exception` ÷ request (log `request` di stdout, atau jumlah event API)
- Latency p95 — property `latency_ms` di `ai_generation_finished`; request p95 dari log
- Biaya AI — sum `cost_usd`
- Fallback rate — `ai_generation_finished` dengan `fallback_used = true`
- Quota violations — count `quota_exceeded`
- Job failure rate — count `job_failed` ÷ job selesai

## Alert (NFR-OBS-06)

Pasang di PostHog (Insight → subscription → email/Slack): error rate > 2% per 15 menit, `job_failed` > 5%, p95 latency > 2× baseline, sum `cost_usd` harian > 150% anggaran.

## Belum ada

- Source map + release tagging (Sentry) — PostHog error tracking hanya mengelompokkan berdasarkan tipe + pesan, tanpa stack trace ter-sourcemap.
- OpenTelemetry trace alur AI (NFR-OBS-04).
- Retensi log 30 hari — sekarang stdout container; andalkan log driver platform.
