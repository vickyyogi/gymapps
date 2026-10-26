import "server-only";

import { log } from "@/lib/log";

const DEFAULT_HOST = "https://us.i.posthog.com";

function host() {
  return (process.env.POSTHOG_HOST || DEFAULT_HOST).replace(/\/+$/, "");
}

export function analyticsEnabled() {
  return Boolean(process.env.POSTHOG_API_KEY);
}

// Fire-and-forget: analytics must never slow a request down or fail it.
function send(payload: Record<string, unknown>) {
  const apiKey = process.env.POSTHOG_API_KEY;
  if (!apiKey) return;
  void fetch(`${host()}/capture/`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ api_key: apiKey, timestamp: new Date().toISOString(), ...payload })
  }).catch((error) => log("warn", "analytics_send_failed", { event: payload.event, error }));
}

/**
 * Product event (NFR-OBS-03). `distinctId` is our internal user id (ULID) — never
 * an email or name, so PostHog can compute DAU/WAU without holding PII.
 */
export function track(
  event: string,
  distinctId: string | null,
  properties: Record<string, unknown> = {}
) {
  send({
    event,
    distinct_id: distinctId ?? "server",
    properties: { ...properties, $lib: "gymapps-server" }
  });
}

/** Error tracking; PostHog groups `$exception` events by type + message. */
export function captureError(error: unknown, properties: Record<string, unknown> = {}) {
  if (!analyticsEnabled()) return;
  const type = error instanceof Error ? error.name : "Error";
  const value = error instanceof Error ? error.message : String(error);
  send({
    event: "$exception",
    distinct_id: typeof properties.user_id === "string" ? properties.user_id : "server",
    properties: {
      ...properties,
      $lib: "gymapps-server",
      $exception_list: [
        {
          type,
          value: value.slice(0, 1000),
          mechanism: { type: "generic", handled: true }
        }
      ]
    }
  });
}
