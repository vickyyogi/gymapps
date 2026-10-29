import { createPrisma } from "./prisma-client.mjs";

// Gate Fase 8 yang butuh data produksi (docs/phase8-hardening.md):
//   - AI failure rate < 2%  (minimal 20 generasi non-fixture)
//   - Biaya AI <= USD 0,30/WAU
// Metrik mengabaikan user fixture (email prefix "phase") supaya E2E tidak mengotori hasil.

const prisma = createPrisma();

const daysArg = process.argv.find((argument) => argument.startsWith("--days="));
const days = Number(daysArg?.split("=")[1] ?? 30);
if (!Number.isFinite(days) || days < 1) throw new Error("usage: --days=<jumlah hari, default 30>");

const MIN_SAMPLE = 20;
const GATE_FAILURE_RATE = 0.02;
const GATE_COST_PER_WAU = 0.3;

const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
const nonFixture = { NOT: { user: { email: { startsWith: "phase" } } } };

async function main() {
  const [byStatus, fallbackUsedCount, costRow, workoutUsers, aiUsers] = await Promise.all([
    prisma.aiGeneration.groupBy({
      by: ["status"],
      where: { createdAt: { gte: since }, ...nonFixture },
      _count: true
    }),
    prisma.aiGeneration.count({
      where: { createdAt: { gte: since }, fallbackUsed: true, ...nonFixture }
    }),
    prisma.aiGeneration.aggregate({
      where: { createdAt: { gte: since }, ...nonFixture },
      _sum: { costUsd: true }
    }),
    prisma.workout.findMany({
      where: { createdAt: { gte: weekAgo }, ...nonFixture },
      select: { userId: true },
      distinct: ["userId"]
    }),
    prisma.aiGeneration.findMany({
      where: { createdAt: { gte: weekAgo }, ...nonFixture },
      select: { userId: true },
      distinct: ["userId"]
    })
  ]);

  const statuses = Object.fromEntries(byStatus.map((row) => [row.status, row._count]));
  const total = byStatus.reduce((sum, row) => sum + row._count, 0);
  const failed = statuses.failed ?? 0;
  const costUsd = Number(costRow._sum.costUsd ?? 0);
  const wau = new Set([...workoutUsers, ...aiUsers].map((row) => row.userId)).size;

  const measured = total >= MIN_SAMPLE;
  const failureRate = total ? failed / total : null;
  const costPerWau = wau ? costUsd / wau : null;

  const gates = {
    ai_failure_rate: !measured
      ? `unmeasured (butuh >= ${MIN_SAMPLE} generasi non-fixture, ada ${total})`
      : failureRate < GATE_FAILURE_RATE
        ? "pass"
        : "fail",
    cost_per_wau: wau === 0
      ? "unmeasured (WAU = 0)"
      : costUsd === 0
        ? "unmeasured (cost 0; isi OPENCODE_GO_PRICE_* bila model berbayar)"
        : costPerWau <= GATE_COST_PER_WAU
          ? "pass"
          : "fail"
  };

  console.log(
    JSON.stringify(
      {
        window_days: days,
        generations: total,
        by_status: statuses,
        fallback_used_rows: fallbackUsedCount,
        ai_failure_rate: failureRate,
        cost_usd: Number(costUsd.toFixed(6)),
        wau_7d: wau,
        cost_per_wau_usd: costPerWau === null ? null : Number(costPerWau.toFixed(6)),
        gates
      },
      null,
      2
    )
  );

  if (Object.values(gates).includes("fail")) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
