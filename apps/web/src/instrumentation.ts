import type { Instrumentation } from "next";

export async function register() {
  // Only the Node server runs background jobs; skip during build and edge runtime.
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NEXT_PHASE === "phase-production-build") {
    return;
  }
  const { startWorker } = await import("./lib/jobs");
  startWorker();
}

// Errors from server components / route handlers that never reach withApi.
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { captureError } = await import("./lib/analytics");
  captureError(error, {
    source: `server:${context.routeType}`,
    route: context.routePath,
    method: request.method
  });
};
