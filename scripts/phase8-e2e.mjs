import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.PHASE8_PORT) || 3110;
const appUrl = `http://127.0.0.1:${port}`;
const apiUrl = `${appUrl}/api/v1`;
const buildId = join(root, "apps/web/.next/BUILD_ID");

function run(script, env = {}) {
  const result = spawnSync(process.execPath, [join(root, "scripts", script)], {
    cwd: root,
    env: { ...process.env, ...env },
    stdio: "inherit"
  });
  assert.equal(result.status, 0, `${script} exited ${result.status}`);
}

function stop(child) {
  if (!child || child.exitCode !== null) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
  } else {
    child.kill("SIGTERM");
  }
}

async function waitFor(url, timeoutMs = 120_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // not ready
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function main() {
  assert.ok(
    existsSync(buildId),
    "Production build missing. Run `npm run build` first (or use `npm run test:phase8`)."
  );

  const server = spawn(
    process.execPath,
    [join(root, "node_modules/next/dist/bin/next"), "start", "-p", String(port)],
    {
      cwd: join(root, "apps/web"),
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"]
    }
  );
  const logs = [];
  server.stdout.on("data", (chunk) => logs.push(chunk.toString()));
  server.stderr.on("data", (chunk) => logs.push(chunk.toString()));

  try {
    await waitFor(`${apiUrl}/health`);
    run("phase3-e2e.mjs", { BASE_URL: apiUrl, APP_URL: appUrl });
    run("phase4-e2e.mjs", { BASE_URL: apiUrl, APP_URL: appUrl });
  } catch (error) {
    if (logs.length) console.error(logs.join(""));
    throw error;
  } finally {
    stop(server);
  }

  run("phase5-e2e.mjs");
  run("phase6-e2e.mjs");
  run("phase7-e2e.mjs");

  console.log(
    JSON.stringify(
      {
        phase8_e2e: "ok",
        production_build: true,
        phases: [3, 4, 5, 6, 7],
        port
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
