export async function register() {
  // Only the Node server runs background jobs; skip during build and edge runtime.
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NEXT_PHASE === "phase-production-build") {
    return;
  }
  const { startWorker } = await import("./lib/jobs");
  startWorker();
}
