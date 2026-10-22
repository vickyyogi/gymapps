# ADR-001 — Bentuk Program AI (Q-02)

- **Status:** Accepted (2026-10-22)
- **Tanggal:** 2026-10-22
- **Pemilik keputusan:** Product + Coach
- **Batas:** sebelum schema Prisma & AI layer
- **Terkait:** `PRD.md` Q-02, FR-06-02, FR-07-12, `data-model.md` §4.1–4.4

## Konteks

Program disimpan sebagai `programs → program_weeks → program_sessions → program_exercises`. AI harus menghasilkan output terstruktur yang lolos validator V-01…V-13. Ada dua bentuk yang mungkin:

- seluruh durasi program (mis. 8 minggu) di-generate sekaligus;
- hanya 1 minggu yang di-generate, minggu berikutnya dibuat saat dibutuhkan.

Keputusan ini menentukan ukuran output token, bentuk validator, context builder, dan UI preview.

## Opsi

### A — Program penuh sejak awal

AI menghasilkan semua minggu dalam satu job.

- **Plus:** preview utuh; progresi antar-minggu bisa divalidasi (`FR-07-04`); offline/mobile sederhana; satu `ai_generation` per program.
- **Minus:** output besar (risiko > 4.000 token); biaya per generate lebih tinggi; sulit meregenerasi satu minggu.

### B — Satu minggu di-roll

AI menghasilkan minggu 1; minggu berikutnya digenerate saat minggu sebelumnya selesai.

- **Plus:** output kecil, murah, adaptif terhadap adherence aktual.
- **Minus:** validator lintas minggu tidak berlaku; `program_weeks` jadi campuran AI dan runtime; butuh job terjadwal; UX "program belum lengkap"; bertentangan dengan `FR-07-12` bila progression rule tidak disimpan.

### C — Hibrida

Buat kerangka semua minggu + detail minggu 1; detail minggu berikutnya diisi saat rollover.

- **Plus:** preview utuh + output kecil.
- **Minus:** dua bentuk data dalam satu tabel; validator harus paham state "belum terisi"; kompleksitas tertinggi.

## Keputusan

**A — program penuh sejak awal.** AI menghasilkan seluruh `duration_weeks` dalam satu job. Setiap minggu tetap divalidasi sebagai bagian dari satu program, dan progresi disimpan sebagai rule per-exercise.

## Konsekuensi

- Jika A: `duration_weeks` tetap 1–52; validator wajib cek progresi volume antar minggu ≤ 15%; batas output 4.000 token perlu test nyata.
- Jika B/C: tambah status kelengkapan minggu dan job rollover; validator perlu dua jalur.
- Bagian yang tidak boleh berubah setelah keputusan: bentuk `program_weeks`, ownership `program_exercises`, dan kontrak preview.

## Pemicu review ulang

- Output 8 minggu konsisten melebihi 4.000 token.
- Lebih dari 30% program AI di-regenerate dalam 7 hari pertama.
