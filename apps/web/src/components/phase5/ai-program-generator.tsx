"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { SPLIT_DAY_RANGE, type SplitType } from "@gymapps/domain";

const SPLITS = ["full_body", "upper_lower", "push_pull_legs", "bro_split", "custom"];
const GOALS = [
  "lose_weight",
  "gain_muscle",
  "strength",
  "endurance",
  "general_fitness",
  "body_recomposition"
];

type Job = {
  job_id: string;
  status: "queued" | "running" | "succeeded" | "failed";
  current_step: string;
  progress_pct: number;
  result: { program_id: string; fallback_used: boolean; repair_attempts: number } | null;
  error: { error: { code: string; message: string } } | null;
};

type Props = {
  mode?: "generate" | "regenerate";
  programId?: string;
  defaults?: {
    goal?: string;
    split_type?: string;
    duration_weeks?: number;
    days_per_week?: number;
    session_minutes?: number;
  };
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function dayRange(split: string): [number, number] {
  return SPLIT_DAY_RANGE[split as SplitType] ?? [1, 7];
}

export function AiProgramGenerator({ mode = "generate", programId, defaults }: Props) {
  const t = useTranslations("ai");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const locale = useLocale();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [split, setSplit] = useState<string>(defaults?.split_type ?? "push_pull_legs");
  const daysRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!job || job.status === "succeeded" || job.status === "failed") return;
    let cancelled = false;

    async function poll() {
      while (!cancelled) {
        await sleep(1_200);
        if (cancelled) return;
        try {
          const response = await fetch(`/api/v1/ai/jobs/${job!.job_id}`);
          const payload = await response.json().catch(() => null);
          if (!response.ok) {
            setError(tErrors("INTERNAL_ERROR"));
            setPending(false);
            return;
          }
          const next = payload.data as Job;
          setJob(next);
          if (next.status === "succeeded" && next.result?.program_id) {
            router.push(`/${locale}/programs/${next.result.program_id}`);
            return;
          }
          if (next.status === "failed") {
            const code = next.error?.error.code ?? "AI_GENERATION_FAILED";
            const base = tErrors.has(code) ? tErrors(code) : tErrors("AI_GENERATION_FAILED");
            const reason = next.error?.error.message ?? "";
            // ponytail: reason masih teks server (Inggris); terjemahkan bila sudah ada glossary.
            setError(reason && !base.includes(reason) ? `${base} (${reason})` : base);
            setPending(false);
            return;
          }
        } catch {
          setError(tErrors("NETWORK_ERROR"));
          setPending(false);
          return;
        }
      }
    }

    void poll();
    return () => {
      cancelled = true;
    };
  }, [job, locale, router, tErrors]);

  function changeSplit(value: string) {
    setSplit(value);
    const [min, max] = dayRange(value);
    const input = daysRef.current;
    if (input) {
      const days = Number(input.value);
      input.value = String(Math.min(max, Math.max(min, days || min)));
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const daysPerWeek = Number(form.get("days_per_week"));
    const [min, max] = dayRange(split);
    if (daysPerWeek < min || daysPerWeek > max) {
      setError(t("dayRangeHint", { min, max }));
      return;
    }
    setPending(true);
    setError(null);
    const body = {
      goal: form.get("goal"),
      split_type: form.get("split_type"),
      duration_weeks: Number(form.get("duration_weeks")),
      days_per_week: daysPerWeek,
      session_minutes: Number(form.get("session_minutes")),
      notes: String(form.get("notes") ?? "").trim() || undefined
    };

    try {
      const url =
        mode === "regenerate" && programId
          ? `/api/v1/ai/programs/${programId}/regenerate`
          : "/api/v1/ai/programs/generate";
      const response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body)
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const code = payload?.error?.code ?? "INTERNAL_ERROR";
        // ponytail: detail teks dari server belum terlokalisasi; terjemahkan path+message bila perlu.
        const details = Array.isArray(payload?.error?.details)
          ? (payload.error.details as Array<{ message?: string }>)
              .map((item) => item?.message)
              .filter(Boolean)
          : [];
        setError(
          details.length
            ? details.join(" · ")
            : tErrors.has(code)
              ? tErrors(code)
              : tErrors("INTERNAL_ERROR")
        );
        setPending(false);
        return;
      }
      setJob({
        job_id: payload.data.job_id,
        status: "queued",
        current_step: "analyzing_profile",
        progress_pct: 0,
        result: null,
        error: null
      });
    } catch {
      setError(tErrors("NETWORK_ERROR"));
      setPending(false);
    }
  }

  const [minDays, maxDays] = dayRange(split);

  return (
    <details className="rounded-xl border border-border bg-card p-4">
      <summary className="cursor-pointer text-sm font-medium">
        {mode === "regenerate" ? t("regenerate") : t("generate")}
      </summary>
      <p className="mt-2 text-xs text-muted-foreground">{t("description")}</p>

      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}

      {job ? (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{t(`steps.${job.current_step}`)}</span>
            <span>{job.progress_pct}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-primary transition-all"
              style={{ width: `${job.progress_pct}%` }}
            />
          </div>
          {job.status === "failed" ? (
            <button
              type="button"
              onClick={() => {
                setJob(null);
                setPending(false);
              }}
              className="rounded-lg border border-border px-3 py-1.5 text-xs"
            >
              {tCommon("retry")}
            </button>
          ) : null}
        </div>
      ) : (
        <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            {t("goal")}
            <select
              name="goal"
              defaultValue={defaults?.goal ?? "gain_muscle"}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
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
              defaultValue={defaults?.split_type ?? "push_pull_legs"}
              onChange={(event) => changeSplit(event.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              {SPLITS.map((option) => (
                <option key={option} value={option}>
                  {t(`splits.${option}`)}
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
              defaultValue={defaults?.duration_weeks ?? 8}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1 text-sm">
            {t("daysPerWeek")}
            <input
              name="days_per_week"
              type="number"
              ref={daysRef}
              min={minDays}
              max={maxDays}
              defaultValue={defaults?.days_per_week ?? 3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <p className="text-xs text-muted-foreground">
              {t("dayRangeHint", { min: minDays, max: maxDays })}
            </p>
          </label>
          <label className="space-y-1 text-sm">
            {t("sessionMinutes")}
            <input
              name="session_minutes"
              type="number"
              min={20}
              max={120}
              defaultValue={defaults?.session_minutes ?? 60}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1 text-sm sm:col-span-2">
            {t("notes")}
            <textarea
              name="notes"
              maxLength={1000}
              rows={2}
              placeholder={t("notesPlaceholder")}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              {pending ? tCommon("loading") : mode === "regenerate" ? t("regenerateAction") : t("generateAction")}
            </button>
          </div>
        </form>
      )}
    </details>
  );
}
