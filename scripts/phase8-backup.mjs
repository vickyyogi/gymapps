import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const compose = join(root, "infra/docker-compose.yml");
const scratch = "gymapps_restore_check";
const scratchUrl = `postgresql://gymapps:gymapps@localhost:5432/${scratch}?schema=public`;
const prisma = new PrismaClient();
let scratchClient = null;

function docker(args, input) {
  const result = spawnSync(
    "docker",
    ["compose", "-f", compose, "exec", "-T", "postgres", ...args],
    { input, maxBuffer: 512 * 1024 * 1024 }
  );
  if (result.status !== 0) {
    throw new Error(
      `docker ${args.join(" ")} exited ${result.status}\n${result.stderr?.toString() ?? ""}`
    );
  }
  return result.stdout;
}

async function counts(client) {
  const [
    users,
    workouts,
    workoutSets,
    programs,
    personalRecords,
    bodyMetrics
  ] = await Promise.all([
    client.user.count(),
    client.workout.count(),
    client.workoutSet.count(),
    client.program.count(),
    client.personalRecord.count(),
    client.bodyMetric.count()
  ]);
  return { users, workouts, workout_sets: workoutSets, programs, personal_records: personalRecords, body_metrics: bodyMetrics };
}

async function main() {
  const dump = docker([
    "pg_dump",
    "-U",
    "gymapps",
    "-d",
    "gymapps",
    "--no-owner",
    "--no-acl"
  ]);
  assert.ok(dump.length > 0, "pg_dump produced an empty backup");

  docker(["psql", "-U", "gymapps", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-c", `DROP DATABASE IF EXISTS ${scratch} WITH (FORCE);`]);
  docker(["psql", "-U", "gymapps", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-c", `CREATE DATABASE ${scratch};`]);
  docker(["psql", "-U", "gymapps", "-d", scratch, "-v", "ON_ERROR_STOP=1", "--quiet"], dump);

  const source = await counts(prisma);
  scratchClient = new PrismaClient({ datasourceUrl: scratchUrl });
  const restored = await counts(scratchClient);

  assert.deepEqual(restored, source, "restored row counts differ from source");
  console.log(
    JSON.stringify(
      {
        phase8_backup_restore: "ok",
        dump_bytes: dump.length,
        scratch_database: scratch,
        counts: restored
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (scratchClient) await scratchClient.$disconnect();
    try {
      docker([
        "psql",
        "-U",
        "gymapps",
        "-d",
        "postgres",
        "-v",
        "ON_ERROR_STOP=1",
        "-c",
        `DROP DATABASE IF EXISTS ${scratch} WITH (FORCE);`
      ]);
    } catch (error) {
      console.error(`cleanup failed: ${error}`);
    }
    await prisma.$disconnect();
  });
