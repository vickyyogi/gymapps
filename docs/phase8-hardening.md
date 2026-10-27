# Fase 8 — Hardening & Beta

Dokumen kerja Fase 8: hasil gate, review index, review PDP, dan blocker staging/beta.

## Perintah

| Gate | Command |
|---|---|
| E2E penuh (build production + fase 3–7) | `npm run test:phase8` |
| Load test analytics | `npm run test:load` |
| Backup/restore drill | `npm run test:backup` |
| Lint + typecheck + unit | `npm run lint && npm run typecheck && npm test` |

`test:load` dan `test:backup` butuh `infra/docker-compose.yml` (Postgres) hidup. `test:phase7` butuh Chrome; `scripts/phase7-e2e.mjs` sekarang auto-detect `CHROME_PATH` di Windows dan Linux.

## Hasil gate (2026-10-23)

| Gate | Hasil | Catatan |
|---|---|---|
| E2E penuh | ✅ `test:phase8` | fase 3–7 hijau di production build, port 3110 |
| p95 analytics | ✅ 237 ms | 140 request, 5 concurrent, 104 workout / 1.248 set, gate < 1.000 ms |
| Error rate analytics | ✅ 0% | 140/140 HTTP 200, gate < 0,5% |
| Backup/restore drill | ✅ | `pg_dump` → restore ke DB `gymapps_restore_check` → jumlah baris sama → drop |
| AI failure rate | ⚠️ belum terukur | gate < 2% perlu ≥ 20 generasi AI non-test; fixture E2E sengaja membuat job gagal |
| Biaya AI / WAU | ⚠️ belum terukur | gate ≤ USD 0,30/WAU perlu data produksi |
| Error rate < 0,5% / rollback otomatis | ⚠️ eksternal | perlu Sentry/APM + deploy target |
| Beta 100 user | ⚠️ eksternal | butuh staging publik + onboarding peserta |

Metrik AI mengabaikan user fixture (email prefix `phase…`) supaya hasil E2E tidak mengotori gate produksi.

## Index review query panas

| Query panas | Index | Status |
|---|---|---|
| riwayat workout (`workouts.user_id`, `started_at`) | `idx_workouts_user_started` | ✅ |
| workout by status (`workouts.user_id`, `status`) | `idx_workouts_user_status` | ✅ |
| set per user (`workout_sets.user_id`, `created_at`) | `idx_sets_user_created` | ✅ |
| set per exercise (`workout_sets.user_id`, `exercise_id`, `created_at`) | `idx_sets_user_exercise_date` | ✅ |
| PR terakhir (`personal_records.user_id`, `achieved_at` desc) | **`idx_pr_user_achieved` (baru)** | ✅ ditambah Fase 8 |
| adherence per program (`program_sessions.program_id`, `completed_at`) | **`idx_program_sessions_completed` (baru)** | ✅ ditambah Fase 8 |
| AI audit (`ai_generations.user_id`, `created_at`) | `idx_ai_gen_user_created` | ✅ |
| export (`exports.user_id`, `created_at`) | `idx_exports_user_created` | ✅ |

Migrasi: `packages/db/prisma/migrations/20261023022506_phase8_indexes`.

Perbaikan kode: `analyticsVolume` sekarang memfilter `created_at >= from` sehingga query memakai `idx_sets_user_created`, bukan membaca seluruh set user.

## Review PDP / privacy

| Item | Status | Keterangan |
|---|---|---|
| Redaksi PII di konteks AI | ✅ | `lib/ai/context.ts` |
| Export HMAC + ownership + expiry 7 hari | ✅ | 403 lintas user, 410 expired, diverifikasi E2E |
| Password hash Argon2id | ✅ | + ganti password aktif (`POST /api/v1/auth/password/change`) |
| Cookie `httpOnly`, `Secure` hanya production | ✅ | |
| Audit log perubahan data | ✅ | profile, program, workout, admin exercise, ganti password, export/report, dan hapus akun (tanpa PII) |
| Hapus akun soft→hard delete | ✅ | `DELETE /api/v1/account` (soft delete `pending_delete` + cabut sesi) + `purgeExpiredAccounts()` (hard delete > 30 hari & hapus `.exports`) + UI 2 langkah di `/settings` |
| Age gate + ToS & Kebijakan Privasi | ✅ | `NFR-PRIV-06` & `NFR-PRIV-10`: halaman `/privacy` & `/terms` dwibahasa, checkbox wajib saat registrasi, validasi usia minimal 16 tahun |
| Verifikasi email + reset password | ✅ | `POST /auth/verify` + `/auth/verify/request` (token 24 jam), `POST /auth/password/forgot` + `/reset` (token 60 menit single-use, revoke semua session). Provider email Resend-compatible via `EMAIL_API_KEY`; tanpa key fitur nonaktif dan register langsung terverifikasi |
| Retensi log 30 hari | ❌ | log stdout saja, belum ada rotasi/retensi |
| Notifikasi email/push | ⚠️ v1.1 | `FR-13-09` (preferensi `email_opt_in` sudah tersedia di `/settings`) |

## Audit log

Ditulis oleh `apps/web/src/lib/audit.ts` untuk mutation:

| Action | Entity |
|---|---|
| `profile.updated` | user_profile |
| `program.created` / `program.updated` / `program.archived` / `program.activated` | program |
| `workout.started` / `workout.updated` / `workout.finished` / `workout.deleted` | workout |
| `exercise.published` / `exercise.updated` | exercise (admin, Fase 7) |
| `password.changed` | user |
| `account.deleted` | user (metadata bebas PII) |
| `export.requested` / `report.requested` | export |

Audit tersimpan di `audit_logs` dengan `actor_id`, `before`, `after`, `ip_address`.

## Blocker eksternal staging & beta

1. **Host staging + registry container** — image siap (`apps/web/Dockerfile`, Next standalone + Chromium, `docs/deploy.md`), tapi belum ada host/registry tujuan, jadi belum pernah dibangun dan `prisma migrate deploy` + rollback otomatis belum dijalankan.
2. **Sentry / APM** — error rate < 0,5% dan rollback otomatis butuh observability eksternal; sekarang hanya structured log.
3. **Rate limit** — memakai tabel Postgres `rate_limits` (upsert atomik, konsisten antar instance); fallback in-memory bila DB tidak tersedia. Redis tidak lagi dipakai, service `redis` di `docker-compose.yml` dihapus.
4. **Object storage (S3/blob)** — selesai: `src/lib/storage.ts` (driver S3 via `@aws-sdk/client-s3` bila `S3_BUCKET` diset, fallback disk `EXPORT_DIR` untuk dev). Butuh bucket + kredensial saat deploy.
5. **Email provider** — verifikasi email dan reset password butuh Resend/SMTP.
6. **PostHog / event produk** — selesai: `src/lib/analytics.ts` mengirim event server-side (`POSTHOG_API_KEY` kosong = no-op). Butuh project PostHog + dashboard saat staging.

## Blocking sebelum gate Fase 8 penuh

- [x] E2E penuh
- [x] Load test analytics p95 < 1 detik
- [x] Review index query panas
- [x] Backup/restore drill
- [x] Review PDP (Tahap A: hapus akun, age gate, ToS/Privacy, audit log lengkap)
- [x] Audit log (profile/program/workout/account/export/password)
- [ ] Error rate < 0,5% + rollback otomatis (butuh APM + staging)
- [ ] AI failure < 2% (butuh data produksi)
- [ ] Biaya ≤ USD 0,30/WAU (butuh data produksi)
- [ ] Deploy staging
- [ ] Beta 100 user
