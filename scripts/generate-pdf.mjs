import { chromium } from "playwright-core";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.resolve(__dirname, "../PANDUAN_SETUP_GYMAPPS.pdf");

const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Panduan Setup & Pengembangan GymApps</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

    @page {
      size: A4;
      margin: 16mm 18mm 16mm 18mm;
      @bottom-right {
        content: counter(page) " / " counter(pages);
        font-family: 'Inter', sans-serif;
        font-size: 8pt;
        color: #64748b;
      }
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 10pt;
      line-height: 1.55;
      color: #1e293b;
      background: #ffffff;
    }

    .header-banner {
      border-bottom: 2px solid #0284c7;
      padding-bottom: 14px;
      margin-bottom: 22px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .header-title h1 {
      font-size: 20pt;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .header-title .subtitle {
      font-size: 10pt;
      color: #64748b;
      font-weight: 500;
      margin-top: 4px;
    }

    .badge-doc {
      background: #e0f2fe;
      color: #0369a1;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 8.5pt;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    h2 {
      font-size: 13pt;
      font-weight: 700;
      color: #0f172a;
      margin-top: 18px;
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    h3 {
      font-size: 10.5pt;
      font-weight: 600;
      color: #1e293b;
      margin-top: 12px;
      margin-bottom: 6px;
    }

    p {
      margin-bottom: 8px;
    }

    ul, ol {
      margin-left: 20px;
      margin-bottom: 10px;
    }

    li {
      margin-bottom: 4px;
    }

    .code-block {
      background: #0f172a;
      color: #f8fafc;
      padding: 10px 14px;
      border-radius: 6px;
      font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
      font-size: 8.5pt;
      line-height: 1.45;
      margin: 8px 0 12px 0;
      white-space: pre;
      overflow-x: hidden;
      border: 1px solid #1e293b;
      page-break-inside: avoid;
    }

    .code-comment {
      color: #94a3b8;
    }

    .code-keyword {
      color: #38bdf8;
    }

    code {
      font-family: 'JetBrains Mono', Consolas, monospace;
      font-size: 8.5pt;
      background: #f1f5f9;
      color: #0f172a;
      padding: 1px 5px;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
    }

    .callout {
      background: #f0fdf4;
      border-left: 4px solid #16a34a;
      padding: 8px 12px;
      border-radius: 0 6px 6px 0;
      margin: 10px 0;
      font-size: 9pt;
      page-break-inside: avoid;
    }

    .callout.info {
      background: #f0f9ff;
      border-left-color: #0284c7;
    }

    .callout.warn {
      background: #fffbeb;
      border-left-color: #d97706;
    }

    .callout-title {
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 2px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0 14px 0;
      font-size: 8.5pt;
      page-break-inside: avoid;
    }

    th, td {
      border: 1px solid #cbd5e1;
      padding: 6px 10px;
      text-align: left;
    }

    th {
      background: #f8fafc;
      color: #0f172a;
      font-weight: 600;
    }

    tr:nth-child(even) {
      background: #f8fafc;
    }

    .grid-two {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin: 8px 0;
      page-break-inside: avoid;
    }

    .card {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 12px;
      background: #fafafa;
    }

    .card h4 {
      font-size: 9.5pt;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 4px;
    }

    .avoid-break {
      page-break-inside: avoid;
    }

    .page-break {
      page-break-before: always;
    }

    .footer {
      margin-top: 24px;
      padding-top: 10px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      color: #94a3b8;
      font-size: 8pt;
    }
  </style>
</head>
<body>

  <div class="header-banner">
    <div class="header-title">
      <h1>🏋️ GymApps — Developer Setup Guide</h1>
      <div class="subtitle">Panduan Instalasi Komputer Baru, Konfigurasi, Testing & Alur Pengembangan</div>
    </div>
    <div class="badge-doc">Next.js 16 + Prisma</div>
  </div>

  <h2>1. Prasyarat Sistem (Prerequisites)</h2>
  <p>Sebelum memulai, pastikan perangkat komputer baru telah terpasang komponen berikut:</p>
  <ul>
    <li><strong>Node.js</strong>: Versi <code>>= 22.0.0</code> (verifikasi dengan <code>node -v</code>).</li>
    <li><strong>NPM</strong>: Versi 10 ke atas bawaan Node.js (verifikasi dengan <code>npm -v</code>).</li>
    <li><strong>Git</strong>: Untuk clone kode sumber dan kontrol versi.</li>
    <li><strong>Docker & Docker Compose</strong>: Digunakan untuk menjalankan PostgreSQL 16 dan S3Mock secara otomatis.</li>
    <li><strong>Editor Kode</strong>: VS Code, Cursor, atau editor TypeScript pilihan Anda.</li>
  </ul>

  <h2>2. Clone Repository</h2>
  <div class="code-block"><span class="code-comment"># Clone repository ke komputer lokal</span>
git clone &lt;URL_REPOSITORY_ANDA&gt;
cd gymapps</div>

  <h2>3. Konfigurasi Environment Variables (.env)</h2>
  <div class="callout info">
    <div class="callout-title">Penting: Penempatan File .env di Monorepo</div>
    Next.js membaca file dari <code>apps/web/.env.local</code> dan Prisma membaca dari <code>packages/db/.env</code> (Next.js tidak membaca file .env di root repository).
  </div>

  <p>Salin template <code>.env.example</code> ke dua lokasi target:</p>

  <div class="grid-two">
    <div class="card">
      <h4>Windows (PowerShell)</h4>
      <div class="code-block" style="margin: 4px 0 0 0;">Copy-Item .env.example packages/db/.env
Copy-Item .env.example apps/web/.env.local</div>
    </div>
    <div class="card">
      <h4>Linux / macOS (Bash)</h4>
      <div class="code-block" style="margin: 4px 0 0 0;">cp .env.example packages/db/.env
cp .env.example apps/web/.env.local</div>
    </div>
  </div>

  <p>Konfigurasi bawaan <code>DATABASE_URL</code> sudah langsung siap pakai dengan Docker:</p>
  <div class="code-block">DATABASE_URL="postgresql://gymapps:gymapps@localhost:5432/gymapps?schema=public"
APP_VERSION="dev"
TRUST_PROXY_HEADERS="false"</div>

  <h2>4. Instalasi Dependensi & Kode Otomatis</h2>
  <p>Jalankan satu perintah otomatis berikut dari root repository:</p>
  <div class="code-block"><span class="code-keyword">npm run</span> setup</div>
  <p>Perintah <code>setup</code> ini secara berurutan mengeksekusi:</p>
  <ol>
    <li><code>npm install</code>: Memasang dependensi seluruh monorepo workspace.</li>
    <li><code>npm run gen:api</code>: Mengompilasi tipe TypeScript dari skema OpenAPI.</li>
    <li><code>npm run db:generate</code>: Melakukan generate Prisma Client ke <code>packages/db</code>.</li>
  </ol>

  <div class="page-break"></div>

  <h2>5. Menjalankan Database, Migrasi, & Seeding</h2>

  <h3>5.1. Jalankan PostgreSQL dengan Docker</h3>
  <div class="code-block"><span class="code-comment"># Menjalankan container PostgreSQL 16 & S3Mock di background</span>
docker compose -f infra/docker-compose.yml up -d</div>
  <div class="callout warn">
    Pastikan port <code>5432</code> tidak sedang digunakan oleh instalasi PostgreSQL lokal lain di komputer Anda.
  </div>

  <h3>5.2. Eksekusi Migrasi Database</h3>
  <div class="code-block"><span class="code-comment"># Membuat seluruh tabel database sesuai skema schema.prisma</span>
<span class="code-keyword">npm run</span> db:migrate</div>

  <h3>5.3. Seeding Data Master Awal</h3>
  <div class="code-block"><span class="code-comment"># Mengisi 20 kelompok otot, 15 alat, 876 katalog latihan, dan prompt AI</span>
<span class="code-keyword">npm run</span> db:seed</div>
  <p>Output yang diharapkan: <code>seed ok: 20 muscles, 15 equipment, 876 exercises</code>.</p>

  <h2>6. Menjalankan Server Pengembangan (Dev Server)</h2>
  <div class="code-block"><span class="code-keyword">npm run</span> dev</div>
  <p>Aplikasi akan aktif di <a href="http://localhost:3000">http://localhost:3000</a> (otomatis diarahkan ke <code>/id</code>):</p>
  <ul>
    <li>Buka menu <strong>Daftar</strong> (<code>http://localhost:3000/id/register</code>) untuk membuat akun testing pertama.</li>
    <li>Karena mode pengembangan lokal tidak memerlukan konfigurasi SMTP/Resend, akun otomatis aktif tanpa verifikasi email.</li>
    <li>Selesaikan alur <strong>Onboarding 5 Langkah</strong> untuk memilih tujuan latihan, peralatan, dan preferensi split.</li>
  </ul>

  <h2>7. Menjalankan Pengujian (Testing & Verifikasi Kualitas)</h2>
  <p>Sebelum melakukan commit perubahan kode, jalankan suite pengujian standar:</p>

  <table>
    <thead>
      <tr>
        <th style="width: 25%;">Perintah</th>
        <th style="width: 25%;">Target Uji</th>
        <th>Deskripsi & Hasil yang Diharapkan</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>npm run typecheck</code></td>
        <td>TypeScript Compiler</td>
        <td>Validasi tipe pada ke-5 workspace (web, db, domain, jobs, shared). Wajib 0 error.</td>
      </tr>
      <tr>
        <td><code>npm run lint</code></td>
        <td>ESLint</td>
        <td>Memeriksa kepatuhan kode dan impor terlarang. Wajib lolos bersih.</td>
      </tr>
      <tr>
        <td><code>npm test</code></td>
        <td>Vitest Unit Tests</td>
        <td>Menjalankan 60 unit test untuk domain logic (1RM, 9 rules rekomendasi) & lib helper.</td>
      </tr>
      <tr>
        <td><code>npm run build</code></td>
        <td>Next.js Turbopack</td>
        <td>Memverifikasi optimasi build produksi pada 79 halaman & endpoint API.</td>
      </tr>
      <tr>
        <td><code>npm run test:phase4</code></td>
        <td>E2E Test Flow</td>
        <td>Menguji alur integrasi onboarding, logger set, kalkulasi delta, & analitik dashboard.</td>
      </tr>
    </tbody>
  </table>

  <div class="page-break"></div>

  <h2>8. Struktur Monorepo & Panduan Modifikasi Kode</h2>

  <div class="avoid-break">
    <div class="code-block"><span class="code-keyword">gymapps/</span>
├── <span class="code-keyword">apps/web/</span>                  <span class="code-comment"># Fullstack Next.js 16 (App Router)</span>
│   ├── src/app/[locale]/       <span class="code-comment"># Halaman UI (dashboard, workout logger, exercises, dsb)</span>
│   ├── src/app/api/v1/         <span class="code-comment"># REST API route handlers</span>
│   ├── src/components/         <span class="code-comment"># Komponen React (Server & Client Components)</span>
│   └── src/i18n/messages/      <span class="code-comment"># Terjemahan bilingual (id.json & en.json)</span>
├── <span class="code-keyword">packages/domain/</span>           <span class="code-comment"># Pure business logic (rumus 1RM, volume, 9 rules AI)</span>
├── <span class="code-keyword">packages/db/</span>               <span class="code-comment"># Prisma ORM, migrations, dan script seed</span>
├── <span class="code-keyword">packages/shared/</span>           <span class="code-comment"># Skema OpenAPI, rate-limits, tipe bersama</span>
└── <span class="code-keyword">infra/</span>                     <span class="code-comment"># docker-compose.yml (PostgreSQL + S3Mock)</span></div>
  </div>

  <h3>Aturan Saat Melakukan Modifikasi:</h3>
  <ol>
    <li>
      <strong>Modifikasi Tampilan & Teks UI</strong>:
      Seluruh string UI wajib mendukung dwibahasa. Gunakan <code>useTranslations()</code> dan tambahkan teks pada <code>apps/web/src/i18n/messages/id.json</code> dan <code>en.json</code>.
    </li>
    <li>
      <strong>Perubahan Skema Database</strong>:
      Edit file <code>packages/db/prisma/schema.prisma</code>. Kemudian jalankan <code>npm run db:migrate</code> untuk membuat file migrasi SQL baru, disusul <code>npm run db:generate</code>.
    </li>
    <li>
      <strong>Penambahan Logika Rekomendasi Fitness</strong>:
      Tempatkan fungsi murni di <code>packages/domain/src/rules/</code> tanpa dependensi React/DB. Tambahkan unit test di <code>packages/domain/src/domain.test.ts</code> dan pastikan lulus lewat <code>npm test</code>.
    </li>
  </ol>

  <h2>9. Troubleshooting Umum</h2>
  <div class="avoid-break">
    <table>
      <thead>
        <tr>
          <th style="width: 35%;">Gejala Masalah</th>
          <th>Solusi Cepat</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>ECONNREFUSED 127.0.0.1:5432</code></td>
          <td>Container database belum menyala. Jalankan <code>docker compose -f infra/docker-compose.yml up -d</code> dan cek statusnya dengan <code>docker ps</code>.</td>
        </tr>
        <tr>
          <td><code>Cannot find module '@gymapps/...'</code></td>
          <td>Symlink monorepo belum terkompilasi. Jalankan <code>npm run setup</code> dari root repositori.</td>
        </tr>
        <tr>
          <td>Port 3000 sudah terpakai aplikasi lain</td>
          <td>Jalankan Next.js di port alternatif: <code>PORT=3001 npm run dev</code>.</td>
        </tr>
        <tr>
          <td>Prisma Client out-of-sync setelah migrasi</td>
          <td>Jalankan <code>npm run db:generate</code> untuk memperbarui type definisi client.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="footer">
    <span>GymApps Documentation &copy; 2026</span>
    <span>Dihasilkan secara otomatis untuk kebutuhan onboarding pengembang</span>
  </div>

</body>
</html>`;

(async () => {
  console.log("Meluncurkan browser headless untuk membuat PDF...");
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage();
  
  await page.setContent(htmlContent, { waitUntil: "networkidle" });
  
  console.log("Menghasilkan PDF di: " + outputPath);
  await page.pdf({
    path: outputPath,
    format: "A4",
    printBackground: true,
    margin: {
      top: "16mm",
      bottom: "16mm",
      left: "18mm",
      right: "18mm"
    }
  });

  await browser.close();
  console.log("PDF Berhasil dibuat!");
})();
