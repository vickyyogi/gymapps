"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { AiProgramGenerator } from "@/components/phase5/ai-program-generator";

type Program = {
  id: string;
  name: string;
  goal: string | null;
  status: string;
  split_type: string;
  duration_weeks: number;
  days_per_week: number;
  completion_pct: number;
  ai_generated: boolean;
};

const SPLITS = ["full_body", "upper_lower", "push_pull_legs", "bro_split", "custom"];
const GOALS = ["lose_weight", "gain_muscle", "strength", "endurance", "general_fitness", "body_recomposition"];

export function ProgramsList() {
  const t = useTranslations("programs");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const locale = useLocale();
  const router = useRouter();
  const [rows, setRows] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    return fetch("/api/v1/programs?limit=50")
      .then((response) => response.json())
      .then((payload) => setRows(payload.data ?? []))
      .catch(() => setError(tErrors("NETWORK_ERROR")))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/v1/programs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          split_type: form.get("split_type"),
          goal: form.get("goal") || undefined,
          duration_weeks: Number(form.get("duration_weeks")),
          days_per_week: Number(form.get("days_per_week")),
          session_minutes: Number(form.get("session_minutes")),
          progression_type: "double_progression"
        })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const code = payload?.error?.code ?? "INTERNAL_ERROR";
        setError(tErrors.has(code) ? tErrors(code) : tErrors("INTERNAL_ERROR"));
        return;
      }
      router.push(`/${locale}/programs/${payload.data.id}`);
    } catch {
      setError(tErrors("NETWORK_ERROR"));
    } finally {
      setCreating(false);
    }
  }

  async function activate(program: Program) {
    setPending(program.id);
    setError(null);
    try {
      const response = await fetch(`/api/v1/programs/${program.id}/activate`, { method: "POST" });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const code = payload?.error?.code ?? "INTERNAL_ERROR";
        setError(tErrors.has(code) ? tErrors(code) : tErrors("INTERNAL_ERROR"));
        return;
      }
      await load();
    } finally {
      setPending(null);
    }
  }

  async function archive(program: Program) {
    setPending(program.id);
    try {
      await fetch(`/api/v1/programs/${program.id}`, { method: "DELETE" });
      await load();
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <AiProgramGenerator />

      <details className="rounded-xl border border-border bg-card p-4">
        <summary className="cursor-pointer text-sm font-medium">{t("create")}</summary>
        <form onSubmit={create} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            {t("name")}
            <input
              name="name"
              required
              maxLength={80}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </label>
          <label className="space-y-1 text-sm">
            {t("goal")}
            <select
              name="goal"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">{t("noGoal")}</option>
              {GOALS.map((goal) => (
                <option key={goal} value={goal}>
                  {t(`goals.${goal}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            {t("split")}
            <select
              name="split_type"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              {SPLITS.map((split) => (
                <option key={split} value={split}>
                  {t(`splits.${split}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            {t("durationWeeks")}
            <input
              name="duration_weeks"
              type="number"
              min={1}
              max={52}
              defaultValue={4}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1 text-sm">
            {t("daysPerWeek")}
            <input
              name="days_per_week"
              type="number"
              min={1}
              max={7}
              defaultValue={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1 text-sm">
            {t("sessionMinutes")}
            <input
              name="session_minutes"
              type="number"
              min={20}
              max={120}
              defaultValue={60}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={creating}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              {creating ? tCommon("loading") : t("createAction")}
            </button>
          </div>
        </form>
      </details>

      {loading ? (
        <p className="text-sm text-muted-foreground">{tCommon("loading")}</p>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {t("empty")}
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((program) => (
            <li
              key={program.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <Link href={`/programs/${program.id}`} className="font-medium hover:underline">
                    {program.name}
                  </Link>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-xs">
                    {t(`status.${program.status}`)}
                  </span>
                  {program.ai_generated ? (
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                      AI
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t(`splits.${program.split_type}`)} · {program.duration_weeks} {t("weeks")} ·{" "}
                  {program.days_per_week} {t("days")} · {Math.round(program.completion_pct)}%
                </p>
                <div className="mt-2 h-1.5 w-48 rounded-full bg-muted">
                  <div
                    className="h-1.5 rounded-full bg-primary"
                    style={{ width: `${Math.min(100, program.completion_pct)}%` }}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/programs/${program.id}`}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium"
                >
                  {t("open")}
                </Link>
                {program.status !== "active" && program.status !== "completed" ? (
                  <button
                    type="button"
                    onClick={() => activate(program)}
                    disabled={pending === program.id}
                    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-60"
                  >
                    {t("activate")}
                  </button>
                ) : null}
                {program.status !== "archived" ? (
                  <button
                    type="button"
                    onClick={() => archive(program)}
                    disabled={pending === program.id}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground disabled:opacity-60"
                  >
                    {t("archive")}
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
