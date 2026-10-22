import "server-only";

import { existsSync } from "node:fs";
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@gymapps/db";
import { newId } from "@/lib/id";
import { log } from "@/lib/log";

const DAY_MS = 24 * 60 * 60 * 1000;

function exportDir() {
  return process.env.EXPORT_DIR || path.join(process.cwd(), ".exports");
}

function monthRange(month: string) {
  const [year, value] = month.split("-").map(Number);
  const start = new Date(Date.UTC(year!, value! - 1, 1));
  const end = new Date(Date.UTC(year!, value!, 1));
  return { start, end };
}

function startOfWeek(date: Date) {
  const value = new Date(date);
  value.setUTCHours(0, 0, 0, 0);
  const day = value.getUTCDay() || 7;
  value.setUTCDate(value.getUTCDate() - (day - 1));
  return value;
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function chartSvg(rows: Array<{ week: string; volume: number }>) {
  if (rows.length === 0) return "<p>Belum ada volume pada periode ini.</p>";
  const width = 640;
  const height = 180;
  const padding = 24;
  const max = Math.max(...rows.map((row) => row.volume), 1);
  const barWidth = (width - padding * 2) / rows.length;
  return `<svg viewBox="0 0 ${width} ${height}" width="100%" role="img" aria-label="Volume mingguan">
    <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="#d4d4d8" />
    ${rows
      .map((row, index) => {
        const barHeight = ((height - padding * 2) * row.volume) / max;
        const x = padding + index * barWidth + barWidth * 0.15;
        const y = height - padding - barHeight;
        return `<rect x="${x}" y="${y}" width="${barWidth * 0.7}" height="${barHeight}" rx="3" fill="#16a34a" />
        <text x="${x + barWidth * 0.35}" y="${height - 6}" font-size="9" text-anchor="middle" fill="#71717a">${escapeHtml(
          row.week.slice(5)
        )}</text>
        <text x="${x + barWidth * 0.35}" y="${Math.max(10, y - 5)}" font-size="9" text-anchor="middle" fill="#3f3f46">${Math.round(
          row.volume
        )}</text>`;
      })
      .join("")}
  </svg>`;
}

export async function createReportJob(options: {
  userId: string;
  month: string;
  includeBodyMetrics: boolean;
}) {
  return prisma.export.create({
    data: {
      id: newId("exp"),
      userId: options.userId,
      type: "pdf_report",
      status: "queued",
      entities: [],
      metadata: {
        month: options.month,
        include_body_metrics: options.includeBodyMetrics
      }
    }
  });
}

export async function runReport(reportId: string) {
  const row = await prisma.export.findUnique({ where: { id: reportId } });
  if (!row || row.type !== "pdf_report" || row.status === "ready") return;
  await prisma.export.update({ where: { id: row.id }, data: { status: "running" } });

  try {
    const metadata = (row.metadata ?? {}) as { month?: string; include_body_metrics?: boolean };
    const month = metadata.month ?? new Date().toISOString().slice(0, 7);
    const { start, end } = monthRange(month);
    const [user, workouts, prs, metrics, program] = await Promise.all([
      prisma.user.findUniqueOrThrow({
        where: { id: row.userId },
        select: { displayName: true, email: true, locale: true, unitSystem: true }
      }),
      prisma.workout.findMany({
        where: {
          userId: row.userId,
          status: "finished",
          deletedAt: null,
          startedAt: { gte: start, lt: end }
        },
        orderBy: { startedAt: "asc" },
        select: {
          id: true,
          title: true,
          startedAt: true,
          durationSeconds: true,
          totalVolumeKg: true,
          totalSets: true
        }
      }),
      prisma.personalRecord.findMany({
        where: { userId: row.userId, achievedAt: { gte: start, lt: end } },
        orderBy: { achievedAt: "asc" },
        include: { exercise: { select: { nameId: true, nameEn: true } } }
      }),
      metadata.include_body_metrics === false
        ? Promise.resolve([])
        : prisma.bodyMetric.findMany({
            where: {
              userId: row.userId,
              deletedAt: null,
              recordedOn: { gte: start, lt: end }
            },
            orderBy: { recordedOn: "asc" }
          }),
      prisma.program.findFirst({
        where: {
          userId: row.userId,
          status: { in: ["active", "completed"] },
          deletedAt: null
        },
        select: { id: true, name: true, daysPerWeek: true }
      })
    ]);

    const weekly = new Map<string, number>();
    for (const workout of workouts) {
      const key = isoDate(startOfWeek(workout.startedAt));
      weekly.set(key, (weekly.get(key) ?? 0) + Number(workout.totalVolumeKg));
    }
    const weeklyRows = [...weekly.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, volume]) => ({ week, volume: round(volume) }));
    const totalVolume = workouts.reduce(
      (sum, workout) => sum + Number(workout.totalVolumeKg),
      0
    );
    const totalDuration = workouts.reduce(
      (sum, workout) => sum + (workout.durationSeconds ?? 0),
      0
    );
    const planned = program ? program.daysPerWeek * 4 : 0;
    const adherence = planned ? Math.min(100, (workouts.length / planned) * 100) : null;
    const language = user.locale === "en" ? "en" : "id";
    const labels =
      language === "en"
        ? {
            title: "Monthly training report",
            period: "Period",
            totalWorkouts: "Workouts",
            volume: "Total volume",
            duration: "Total duration",
            adherence: "Adherence",
            prs: "Personal records",
            volumeTrend: "Weekly volume",
            workoutList: "Workout list",
            bodyMetrics: "Body metrics",
            none: "No data in this period.",
            generated: "Generated"
          }
        : {
            title: "Laporan latihan bulanan",
            period: "Periode",
            totalWorkouts: "Total workout",
            volume: "Total volume",
            duration: "Total durasi",
            adherence: "Kepatuhan",
            prs: "Personal record",
            volumeTrend: "Volume mingguan",
            workoutList: "Daftar workout",
            bodyMetrics: "Body metrics",
            none: "Belum ada data pada periode ini.",
            generated: "Dibuat"
          };

    const html = `<!doctype html>
<html lang="${language}"><head><meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body { font-family: "DejaVu Sans", Arial, sans-serif; color: #18181b; margin: 28px; font-size: 12px; }
  h1 { font-size: 24px; margin: 0 0 4px; }
  h2 { font-size: 15px; margin: 24px 0 8px; }
  .muted { color: #71717a; }
  .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 18px; }
  .card { border: 1px solid #e4e4e7; border-radius: 8px; padding: 10px; }
  .card b { display: block; font-size: 18px; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #e4e4e7; }
  th { background: #f4f4f5; }
  .cover { border-bottom: 3px solid #16a34a; padding-bottom: 14px; }
</style></head>
<body>
  <div class="cover">
    <h1>${escapeHtml(labels.title)}</h1>
    <p class="muted">${escapeHtml(user.displayName ?? user.email)} · ${escapeHtml(labels.period)} ${month}</p>
  </div>
  <div class="grid">
    <div class="card">${labels.totalWorkouts}<b>${workouts.length}</b></div>
    <div class="card">${labels.volume}<b>${Math.round(totalVolume).toLocaleString("id-ID")} kg</b></div>
    <div class="card">${labels.duration}<b>${Math.round(totalDuration / 60)} min</b></div>
    <div class="card">${labels.adherence}<b>${adherence === null ? "—" : `${Math.round(adherence)}%`}</b></div>
  </div>
  <h2>${labels.volumeTrend}</h2>
  ${chartSvg(weeklyRows)}
  <h2>${labels.prs}</h2>
  ${
    prs.length
      ? `<table><thead><tr><th>Exercise</th><th>Type</th><th>Value</th><th>Date</th></tr></thead><tbody>${prs
          .map(
            (pr) =>
              `<tr><td>${escapeHtml(
                language === "en" ? pr.exercise.nameEn : pr.exercise.nameId
              )}</td><td>${escapeHtml(pr.recordType)}</td><td>${Number(pr.value)}</td><td>${isoDate(
                pr.achievedAt
              )}</td></tr>`
          )
          .join("")}</tbody></table>`
      : `<p class="muted">${labels.none}</p>`
  }
  <h2>${labels.workoutList}</h2>
  ${
    workouts.length
      ? `<table><thead><tr><th>Date</th><th>Session</th><th>Volume</th><th>Sets</th><th>Duration</th></tr></thead><tbody>${workouts
          .map(
            (workout) =>
              `<tr><td>${isoDate(workout.startedAt)}</td><td>${escapeHtml(
                workout.title ?? "—"
              )}</td><td>${Math.round(Number(workout.totalVolumeKg))} kg</td><td>${
                workout.totalSets
              }</td><td>${workout.durationSeconds ? Math.round(workout.durationSeconds / 60) : 0} min</td></tr>`
          )
          .join("")}</tbody></table>`
      : `<p class="muted">${labels.none}</p>`
  }
  ${
    metadata.include_body_metrics === false
      ? ""
      : `<h2>${labels.bodyMetrics}</h2>${
          metrics.length
            ? `<table><thead><tr><th>Date</th><th>Weight</th><th>Body fat</th><th>Waist</th></tr></thead><tbody>${metrics
                .map(
                  (metric) =>
                    `<tr><td>${isoDate(metric.recordedOn)}</td><td>${
                      metric.weightKg === null ? "—" : Number(metric.weightKg)
                    } kg</td><td>${
                      metric.bodyFatPct === null ? "—" : `${Number(metric.bodyFatPct)}%`
                    }</td><td>${metric.waistCm === null ? "—" : `${Number(metric.waistCm)} cm`}</td></tr>`
                )
                .join("")}</tbody></table>`
            : `<p class="muted">${labels.none}</p>`
        }`
  }
  <p class="muted" style="margin-top:28px">${labels.generated}: ${new Date().toISOString()}</p>
</body></html>`;

    await mkdir(exportDir(), { recursive: true });
    const filePath = path.join(exportDir(), `${row.id}.pdf`);
    const { chromium } = await import("playwright-core");
    const executablePath =
      process.env.CHROME_PATH ||
      (existsSync("/usr/bin/google-chrome") ? "/usr/bin/google-chrome" : undefined);
    const browser = await chromium.launch({
      ...(executablePath ? { executablePath } : {}),
      args: ["--no-sandbox", "--disable-dev-shm-usage"]
    });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "load" });
      await page.pdf({ path: filePath, format: "A4", printBackground: true });
    } finally {
      await browser.close();
    }

    const size = (await stat(filePath)).size;
    const expiresAt = new Date(Date.now() + 7 * DAY_MS);
    await prisma.$transaction([
      prisma.export.update({
        where: { id: row.id },
        data: {
          status: "ready",
          filePath,
          fileSizeBytes: size,
          expiresAt,
          errorMessage: null,
          periodStart: start,
          periodEnd: new Date(end.getTime() - DAY_MS)
        }
      }),
      prisma.notification.create({
        data: {
          id: newId("ntf"),
          userId: row.userId,
          type: "report",
          title: language === "en" ? "Monthly PDF is ready" : "PDF bulanan siap",
          body:
            language === "en"
              ? `${month} · link valid for 7 days.`
              : `${month} · link berlaku 7 hari.`,
          link: "/exports"
        }
      })
    ]);
  } catch (error) {
    log("error", "report_failed", { report_id: row.id, error });
    await prisma.export.update({
      where: { id: row.id },
      data: { status: "failed", errorMessage: "PDF generation failed" }
    });
  }
}
