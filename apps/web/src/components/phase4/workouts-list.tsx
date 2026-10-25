"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { fromKg } from "@gymapps/domain";

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
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-headline">{t("title")}</h1>
          <p className="mt-1 text-body-small text-text-secondary">{t("description")}</p>
        </div>
        <button
          type="button"
          onClick={start}
          disabled={starting || Boolean(active)}
          className="btn btn-primary btn-md"
        >
          {starting ? tCommon("loading") : t("start")}
        </button>
      </div>

      {error ? (
        <p role="alert" className="input-helper input-helper-error animate-fade-in">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-body text-text-tertiary animate-fade-in">{tCommon("loading")}</p>
      ) : (
        <>
          {active ? (
            <button
              type="button"
              onClick={() => router.push(`/${locale}/workouts/${active.id}`)}
              className="card border-primary/40 bg-primary-light/50 w-full text-left animate-slide-up"
            >
              <div className="flex items-center justify-between gap-3">
                <span>
                  <span className="text-overline text-primary">{t("resume")}</span>
                  <span className="mt-1 block font-medium text-text-primary">{active.title}</span>
                  <span className="mt-0.5 block text-caption text-text-secondary">
                    {new Date(active.started_at).toLocaleString()} · {active.total_sets} {t("sets")}
                  </span>
                </span>
                <span className="text-body font-medium text-primary">{t("continue")}</span>
              </div>
            </button>
          ) : null}

          <section className="space-y-2">
            <h2 className="text-subhead">{t("history")}</h2>
            {history.length === 0 ? (
              <div className="card border-dashed border-border text-center py-6 animate-fade-in">
                <p className="text-body text-text-tertiary">{t("empty")}</p>
              </div>
            ) : (
              <ul className="list">
                {history.map((workout) => (
                  <li key={workout.id}>
                    <button
                      type="button"
                      onClick={() => router.push(`/${locale}/workouts/${workout.id}`)}
                      className="list-item gap-3 w-full text-left hover:bg-background active:bg-primary-light/50"
                    >
                      <span className="flex-1 min-w-0">
                        <span className="block text-body font-medium text-text-primary truncate">{workout.title}</span>
                        <span className="text-caption text-text-secondary">
                          {new Date(workout.started_at).toLocaleDateString()} ·{" "}
                          {workout.exercise_count} {t("exercises")}
                        </span>
                      </span>
                      <span className="text-caption text-text-tertiary whitespace-nowrap flex-shrink-0">
                        {fmt(fromKg(workout.total_volume_kg, "metric"))} kg · {workout.total_sets} {t("sets")}
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