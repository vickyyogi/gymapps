import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { analyticsEnabled, captureError, track } from "@/lib/analytics";

function stubFetch() {
  const calls: { url: string; body: Record<string, unknown> }[] = [];
  vi.stubGlobal("fetch", (url: string, init: { body: string }) => {
    calls.push({ url, body: JSON.parse(init.body) });
    return Promise.resolve(new Response("{}", { status: 200 }));
  });
  return calls;
}

describe("analytics", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("is disabled without POSTHOG_API_KEY and sends nothing", () => {
    vi.stubEnv("POSTHOG_API_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(analyticsEnabled()).toBe(false);
    track("workout_completed", "usr_1");
    captureError(new Error("boom"));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts product events to the capture endpoint", () => {
    vi.stubEnv("POSTHOG_API_KEY", "phc_test");
    vi.stubEnv("POSTHOG_HOST", "https://eu.i.posthog.com/");
    const calls = stubFetch();
    track("workout_completed", "usr_1", { total_sets: 12 });
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toBe("https://eu.i.posthog.com/capture/");
    expect(calls[0]!.body).toMatchObject({
      api_key: "phc_test",
      event: "workout_completed",
      distinct_id: "usr_1",
      properties: { total_sets: 12, $lib: "gymapps-server" }
    });
  });

  it("sends errors as $exception grouped by type and message", () => {
    vi.stubEnv("POSTHOG_API_KEY", "phc_test");
    const calls = stubFetch();
    captureError(new TypeError("boom"), { user_id: "usr_1", source: "api" });
    expect(calls[0]!.body).toMatchObject({
      event: "$exception",
      distinct_id: "usr_1",
      properties: {
        source: "api",
        $exception_list: [{ type: "TypeError", value: "boom" }]
      }
    });
  });
});
