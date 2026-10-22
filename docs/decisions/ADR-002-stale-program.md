# ADR-002 — Kapan Program Dianggap Stale (Q-06)

- **Status:** Accepted (2026-10-22)
- **Tanggal:** 2026-10-22
- **Pemilik keputusan:** Coach + Product
- **Batas:** sebelum rule engine (`domain/rules`)
- **Terkait:** `PRD.md` Q-06, FR-10-02, `data-model.md` `programs.is_stale`

## Konteks

Rule `stale_program` harus deterministik dan bisa dijelaskan ke user. Definisi "stale" harus cukup awal supaya program tidak basi, tapi tidak terlalu agresif sampai user terus-menerus diminta regenerate.

## Opsi

### A — Berbasis kalender

Program AI aktif dianggap stale setelah N minggu sejak `start_date` atau `created_at`.

- **Plus:** sederhana, mudah diuji, tidak butuh data workout.
- **Minus:** user yang baru mulai terlambat dianggap stale; user disiplin juga kena.

### B — Berbasis penyelesaian

Stale bila `duration_weeks` terlampaui, atau X% sesi sudah selesai tanpa ada PR baru dalam Y minggu.

- **Plus:** relevan dengan pemakaian nyata.
- **Minus:** butuh query analytics; user yang tidak pernah latihan tidak pernah stale.

### C — Gabungan

Stale bila salah satu terpenuhi:

1. `duration_weeks` + 2 minggu terlewati, atau
2. 6 minggu sejak aktivasi tanpa penyelesaian satu sesi pun, atau
3. profil berubah material (goal, level, cedera, equipment) sejak program dibuat.

- **Plus:** menangkap program selesai, program terbengkalai, dan program yang tidak lagi cocok.
- **Minus:** tiga kondisi untuk diuji.

## Keputusan

**C — gabungan.** Stale bila salah satu terpenuhi: `duration_weeks + 2` minggu terlewati, 6 minggu sejak aktivasi tanpa satu sesi selesai, atau profil berubah material sejak program dibuat. Dievaluasi setelah workout `finished` dan sekali sehari. `is_stale` hanya flag; regenerasi tetap keputusan user (`FR-07-06`).

## Konsekuensi

- Butuh timestamp pembuatan program dan snapshot profil saat generate (`ai_rationale` atau metadata).
- Rule harus punya test untuk tiap kondisi dan tidak boleh menandai program `draft`.
- Notifikasi memakai teks dari template, bukan LLM, agar murah.

## Pemicu review ulang

- Lebih dari 40% program aktif ber-flag stale dalam satu bulan.
- Kurang dari 10% user menerima rekomendasi regenerate.
