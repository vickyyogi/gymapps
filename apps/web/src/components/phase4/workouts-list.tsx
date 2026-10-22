"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

type Workout = {
  id: string;
  title: string;
  status: "active" | "finished" | "abandoned";
  started_at: string;
  total_volume_kg: number;
  total_sets: number;
  exercise_count: number;
  pr_count: number;
};

function fmt(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function WorkoutsList() {
  const t = useTranslations("workouts");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const locale = useLocale();
  const router = useRouter();
  const [active, setActive] = useState<Workout | null>(null);
  const [history, setHistory] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/v1/workouts/active").then((response) => response.json()),
      fetch("/api/v1/workouts?status=finished&limit=20").then((response) => response.json())
    ])
      .then(([activePayload, historyPayload]) => {
        setActive(activePayload.data?.[0] ?? null);
        setHistory(historyPayload.data ?? []);
      })
      .catch(() => setError(tErrors("NETWORK_ERROR")))
      .finally(() => setLoading(false));
  }, [tErrors]);

  async function start() {
    setStarting(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/workouts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ source: "quick" })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const code = payload?.error?.code ?? "INTERNAL_ERROR";
        setError(tErrors.has(code) ? tErrors(code) : tErrors("INTERNAL_ERROR"));
        return;
      }
      router.push(`/${locale}/workouts/${payload.data.id}`);
    } catch {
      setError(tErrors("NETWORK_ERROR"));
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <button
          type="button"
          onClick={start}
          disabled={starting || Boolean(active)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {starting ? tCommon("loading") : t("start")}
        </button>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">{tCommon("loading")}</p>
      ) : (
        <>
          {active ? (
            <button
              type="button"
              onClick={() => router.push(`/${locale}/workouts/${active.id}`)}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-primary/40 bg-primary/10 p-4 text-left"
            >
              <span>
                <span className="block text-xs font-medium uppercase tracking-wide text-primary">
                  {t("resume")}
                </span>
                <span className="mt-1 block font-medium">{active.title}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {new Date(active.started_at).toLocaleString()} · {active.total_sets} {t("sets")}
                </span>
              </span>
              <span className="text-sm font-medium text-primary">{t("continue")}</span>
            </button>
          ) : null}

          <section className="space-y-2">
            <h2 className="text-sm font-medium">{t("history")}</h2>
            {history.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                {t("empty")}
              </div>
            ) : (
              <ul className="divide-y divide-border rounded-xl border border-border bg-card">
                {history.map((workout) => (
                  <li key={workout.id}>
                    <button
                      type="button"
                      onClick={() => router.push(`/${locale}/workouts/${workout.id}`)}
                      className="flex w-full flex-wrap items-center justify-between gap-2 px-4 py-3 text-left hover:bg-muted/50"
                    >
                      <span>
                        <span className="block text-sm font-medium">{workout.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(workout.started_at).toLocaleDateString()} ·{" "}
                          {workout.exercise_count} {t("exercises")}
                        </span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {fmt(workout.total_volume_kg)} kg · {workout.total_sets} {t("sets")}
                        {workout.pr_count ? ` · ${workout.pr_count} PR` : ""}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
