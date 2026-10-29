"use client";

import { useEffect, useRef, useState } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { DashboardOverview } from "@/components/phase4/dashboard-overview";
import { FIXTURES, FIXTURE_ORDER, type FixtureName } from "@/dev/break-ui-fixtures";

// Fixtures enter through the same boundary as real data: the network.
// Stub is installed at bundle-eval time so it is in place before any child
// useEffect fires. Dev-only route (page.tsx 404s in production).
const STUB_FLAG = "__breakUiFetchStub";

function currentMode(): FixtureName {
  const raw = new URLSearchParams(window.location.search).get("data");
  return (FIXTURE_ORDER as string[]).includes(raw ?? "") ? (raw as FixtureName) : "demo";
}

if (typeof window !== "undefined" && !(window as unknown as Record<string, boolean>)[STUB_FLAG]) {
  (window as unknown as Record<string, boolean>)[STUB_FLAG] = true;
  const realFetch = window.fetch.bind(window);
  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { "content-type": "application/json" }
    });

  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const path = url.split("?")[0];
    const f = FIXTURES[currentMode()];
    switch (path) {
      case "/api/v1/analytics/summary":
        return Promise.resolve(json({ data: f.summary }));
      case "/api/v1/analytics/volume":
        return Promise.resolve(json({ data: f.volume }));
      case "/api/v1/analytics/calendar":
        return Promise.resolve(json({ data: f.calendar }));
      case "/api/v1/workouts/active":
        return Promise.resolve(json({ data: f.active ? [f.active] : [] }));
      case "/api/v1/programs":
        return Promise.resolve(json({ data: f.program ? [f.program] : [] }));
      case "/api/v1/profile":
        return Promise.resolve(json({ data: f.profile }));
      case "/api/v1/auth/login":
        return Promise.resolve(json(f.login.body, f.login.status));
      default:
        return realFetch(input, init);
    }
  };
}

export function BreakUiHarness() {
  const [mode, setMode] = useState<FixtureName>("demo");
  const [dark, setDark] = useState(false);
  const loginRef = useRef<HTMLDivElement>(null);
  const fixture = FIXTURES[mode];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setMode(currentMode());
    const isDark = params.get("dark") === "1";
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  // Drive the login form like a user: fill, then submit so the API error renders.
  useEffect(() => {
    const form = loginRef.current?.querySelector("form");
    if (!form) return;
    const email = form.querySelector<HTMLInputElement>('input[name="email"]');
    const password = form.querySelector<HTMLInputElement>('input[name="password"]');
    if (email && fixture.loginPrefill) email.value = fixture.loginPrefill.email;
    if (password) password.value = "correct-horse-battery-staple-123";
    if (fixture.login.autoSubmit) form.requestSubmit();
  }, [mode, fixture]);

  function select(next: FixtureName) {
    const url = new URL(window.location.href);
    url.searchParams.set("data", next);
    window.history.replaceState(null, "", url);
    setMode(next);
  }

  function toggleDark() {
    const url = new URL(window.location.href);
    const next = !dark;
    if (next) url.searchParams.set("dark", "1");
    else url.searchParams.delete("dark");
    window.history.replaceState(null, "", url);
    document.documentElement.classList.toggle("dark", next);
    setDark(next);
  }

  return (
    <div style={{ paddingBottom: 72 }}>
      <p className="px-4 pt-4 text-caption text-text-tertiary">
        break-ui harness · {fixture.label}
      </p>

      <div className="flex min-h-[60vh] items-center justify-center px-4 py-8">
        <div key={mode} ref={loginRef}>
          <LoginForm />
        </div>
      </div>

      <div className="border-t border-border px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <DashboardOverview key={mode} name={fixture.name} unitSystem={fixture.unitSystem} />
        </div>
      </div>

      <div
        style={{
          position: "fixed",
          bottom: 12,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 50,
          display: "flex",
          gap: 4,
          background: "#e5e7eb",
          padding: 4,
          borderRadius: 9999,
          fontFamily: "system-ui, sans-serif",
          fontSize: 13,
          boxShadow: "0 2px 8px rgba(0,0,0,.15)"
        }}
      >
        {FIXTURE_ORDER.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => select(name)}
            style={{
              border: 0,
              borderRadius: 9999,
              padding: "6px 12px",
              cursor: "pointer",
              background: mode === name ? "#fff" : "transparent",
              color: "#111827",
              fontWeight: mode === name ? 600 : 400
            }}
          >
            {FIXTURES[name].label}
          </button>
        ))}
        <button
          type="button"
          onClick={toggleDark}
          style={{
            border: 0,
            borderRadius: 9999,
            padding: "6px 12px",
            cursor: "pointer",
            background: "transparent",
            color: "#111827"
          }}
        >
          {dark ? "Light" : "Dark"}
        </button>
      </div>
    </div>
  );
}
