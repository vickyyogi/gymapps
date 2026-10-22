# ADR-003 — Retry Anthropic Sebelum Fallback (Q-08)

- **Status:** Accepted (2026-10-22)
- **Tanggal:** 2026-10-22
- **Pemilik keputusan:** Engineering
- **Batas:** sebelum AI orchestrator & job generator
- **Terkait:** `PRD.md` Q-08 §6.6, `ai/prompt-spec.md` §12

## Konteks

Kegagalan AI tidak boleh membuat job menggantung atau user menunggu tanpa batas. Retry menambah peluang sukses, tapi juga biaya dan latency. Kebijakan harus dibedakan per jenis kegagalan.

## Opsi

### A — Tanpa retry, langsung fallback

- **Plus:** latency terendah, biaya terendah, implementasi paling sederhana.
- **Minus:** gangguan sesaat langsung menurunkan kualitas ke rule-based.

### B — Retry terbatas per jenis error

- Timeout / 5xx: maksimal 2 retry, backoff 1s lalu 4s.
- 429: 1 retry, hormati `Retry-After`, maksimal tunggu 10s.
- Output invalid schema: bukan retry transien, tapi 1 repair pass.
- Budget habis / safety: tanpa retry.

- **Plus:** seimbang; sesuai fallback ladder PRD.
- **Minus:** butuh klasifikasi error dan deadline total.

### C — Retry agresif (3–5×)

- **Plus:** peluang sukses tertinggi.
- **Minus:** biaya dan latency tidak terkendali; memperparah 429.

## Keputusan

**B — retry terbatas per jenis error.** Timeout/5xx maksimal 2 retry (backoff 1s lalu 4s); 429 maksimal 1 retry dengan `Retry-After` dan tunggu maksimal 10s; output invalid schema memakai 1 repair pass; budget habis/safety tanpa retry. Deadline total job 90 detik. Setelah batas: rule-based fallback dan `ai_generations.status = 'fallback'`.

## Konsekuensi

- `ai_generations.retry_count`, `error_code`, `fallback_used`, dan `latency_ms` wajib terisi.
- Test wajib mensimulasikan timeout, 500, 429, JSON invalid, dan budget habis.
- Retry tidak boleh menduplikasi program; idempotensi dijaga oleh job ID.
- Biaya retry dihitung ke `cost_usd`.

## Pemicu review ulang

- Fallback rate > 5% dalam 7 hari.
- p95 waktu generate > 60 detik.
- Biaya retry > 10% total biaya AI.
