# Dokumentasi GymApps

Dokumen produk & teknis untuk **GymApps** — workout tracker + AI coach (pasar Indonesia, bilingual ID/EN).

## Peta Dokumen

| Dokumen | Isi | Pembaca |
|---|---|---|
| [`PRD.md`](./PRD.md) | Product Requirements Document: masalah, goals, persona, 14 epik dengan user stories + FR + acceptance criteria, arsitektur, NFR, KPI, roadmap, risiko | Tim dev, product, stakeholder |
| [`data-model.md`](./data-model.md) | Skema PostgreSQL lengkap: ERD, definisi kolom & constraint, index, materialized view, strategi migrasi & soft delete | Backend engineer |
| [`api/openapi.yaml`](./api/openapi.yaml) | Kontrak REST API `/api/v1` (59 endpoint, 28 schema) — sumber kebenaran integrasi web & mobile | Frontend & mobile engineer |
| [`ai/prompt-spec.md`](./ai/prompt-spec.md) | System prompt (program generator, coach chat, repair pass, narator), tool definitions, validator V-01…V-13, guardrail, eval set, kontrol biaya | Engineer AI/ML, product |
| [`plan.md`](./plan.md) | Rencana implementasi per fase, gate, protokol perubahan, sinyal peringatan dini | Tim dev, tech lead |
| [`decisions/`](./decisions/) | ADR keputusan terbuka Q-02, Q-06, Q-08, Q-10 | Product, engineering |

## Urutan Pembacaan yang Disarankan

1. **PRD.md §1–§4** — pahami masalah, scope, dan batas v1.
2. **PRD.md §5** — daftar pekerjaan yang harus dikerjakan (14 epik, prioritas MoSCoW).
3. **data-model.md** — skim dulu supaya nama entitas sudah familiar.
4. **api/openapi.yaml** — kontrak yang dipakai frontend.
5. **ai/prompt-spec.md** — hanya jika mengerjakan fitur AI.
6. **PRD.md §6, §9, §10** — detail arsitektur, AI, dan NFR saat implementasi.

## Ringkasan Keputusan Produk

| Aspek | Keputusan |
|---|---|
| Produk | Workout tracker + AI (generator program, coach chat, rekomendasi progres) |
| Platform | Web-first (Next.js fullstack) → mobile v2.0 memakai backend yang sama |
| Pasar | Indonesia, bilingual ID/EN (default `id`) |
| Stack | Next.js 15 · TypeScript · PostgreSQL 16 · Prisma · Tailwind + shadcn/ui |
| Auth | Email+password (Argon2id) · sesi persisten 30 hari (cookie httpOnly) |
| AI | Anthropic Claude API — Sonnet (coach & program), Haiku (narasi) |
| Monetisasi | Free beta di v1; layer entitlement dibangun sejak awal; Midtrans di v1.2 |
| Konten exercise | Seed manual 200 exercise (ID/EN), direview human |

## Dokumentasi Keudsaraan

Setiap perubahan yang menyentuh kontrak harus memperbarui dokumen terkait dalam PR yang sama:

| Perubahan | Dokumen yang wajib di-update |
|---|---|
| Endpoint baru/berubah | `api/openapi.yaml` + PRD §8 |
| Kolom/constraint baru | `data-model.md` + PRD §7 |
| Prompt atau aturan AI berubah | `ai/prompt-spec.md` + PRD §9 |
| Requirement/AC berubah | `PRD.md` §5 |
| Risiko atau KPI baru | `PRD.md` §2, §12, §15 |

## Pertanyaan Terbuka

10 pertanyaan yang masih menunggu keputusan ada di [`PRD.md` §16](./PRD.md#16-pertanyaan-terbuka-open-questions). Yang paling impacting: **Q-02** (bentuk program AI — 8 minggu penuh vs 1 minggu yang di-roll) karena menentukan desain skema program.
