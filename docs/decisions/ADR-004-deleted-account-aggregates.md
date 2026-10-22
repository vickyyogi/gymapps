# ADR-004 — Data User Terhapus pada Statistik Agregat (Q-10)

- **Status:** Proposed
- **Tanggal:** 2026-10-22
- **Pemilik keputusan:** Product + Legal
- **Batas:** sebelum job hard-delete akun
- **Terkait:** `PRD.md` Q-10, FR-13-07, `data-model.md` §9

## Konteks

Penghapusan akun menghapus data user-scoped setelah 30 hari. Pertanyaannya: apakah baris agregat yang sudah terlanjur dihitung (mis. benchmark volume anonim) ikut dihapus, dianonimkan, atau dipertahankan.

## Opsi

### A — Hapus semua, termasuk agregat

- **Plus:** paling aman secara privasi; sederhana untuk dijelaskan.
- **Minus:** metrik historis perusahaan berubah setelah penghapusan; perlu recompute.
- **Catatan:** jika agregat disimpan sebagai materialized view dari tabel sumber, ini otomatis terjadi.

### B — Anonimisasi ireversibel

Hapus `user_id` dan seluruh quasi-identifier; simpan hanya angka agregat dengan ambang minimum (mis. n ≥ 10).

- **Plus:** statistik tetap berguna; tidak ada data pribadi tersisa.
- **Minus:** butuh proses eksplisit dan dokumentasi; risiko re-identifikasi bila grup kecil.

### C — Pertahankan baris agregat apa adanya

- **Plus:** tidak ada pekerjaan tambahan.
- **Minus:** sulit dipertahankan secara legal bila masih bisa ditautkan ke user.

## Keputusan

_TBD — isi setelah review._

Rekomendasi awal: **A** untuk data operasional + **B** hanya untuk tabel agregat yang memang dirancang anonim (tanpa `user_id`, ambang n ≥ 10), dengan penjelasan di kebijakan privasi.

## Konsekuensi

- Hard-delete job harus menghapus DB user-scoped, object storage, dan cache.
- Materialized view di-refresh setelah delete; angka historis bisa berubah.
- Audit log penghapusan disimpan tanpa PII.
- Tidak boleh ada tabel agregat baru tanpa keputusan eksplisit soal retensi.

## Pemicu review ulang

- Ada kebutuhan benchmark publik atau laporan investor.
- Perubahan regulasi PDP yang mengatur data turunan.
