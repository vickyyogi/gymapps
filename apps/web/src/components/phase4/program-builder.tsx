"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { ExercisePicker, type PickedExercise } from "@/components/phase4/exercise-picker";
import { AiProgramGenerator } from "@/components/phase5/ai-program-generator";

type ProgramExercise = {
  id: string;
  exercise_id: string;
  exercise_name: string;
  target_sets: number;
  target_reps_min: number;
  target_reps_max: number;
  rest_seconds: number;
};

type ProgramSession = {
  id: string;
  week_number: number;
  day_index: number;
  name: string;
  completed_at: string | null;
  exercises: ProgramExercise[];
};

type ProgramWeek = {
  id: string;
  week_number: number;
  sessions: ProgramSession[];
};

type Program = {
  id: string;
  name: string;
  goal: string | null;
  status: string;
  split_type: string;
  duration_weeks: number;
  days_per_week: number;
  session_minutes: number;
  completion_pct: number;
  ai_generated: boolean;
  ai_rationale: {
    summary?: string;
    assumptions?: string[];
    safety_notes?: string[];
    fallback_used?: boolean;
    repair_attempts?: number;
  } | null;
  weeks: ProgramWeek[];
};

export function ProgramBuilder({ programId }: { programId: string }) {
  const t = useTranslations("program");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const locale = useLocale();
  const router = useRouter();
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/v1/programs/${programId}`);
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const code = payload?.error?.code ?? "INTERNAL_ERROR";
        setError(tErrors.has(code) ? tErrors(code) : tErrors("INTERNAL_ERROR"));
        return;
      }
      setProgram(payload.data);
    } catch {
      setError(tErrors("NETWORK_ERROR"));
    } finally {
      setLoading(false);
    }
  }, [programId, tErrors]);

  useEffect(() => {
    load();
  }, [load]);

  async function activate() {
    if (!program) return;
    setPending("activate");
    const response = await fetch(`/api/v1/programs/${program.id}/activate`, { method: "POST" });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const code = payload?.error?.code ?? "INTERNAL_ERROR";
      setError(tErrors.has(code) ? tErrors(code) : tErrors("INTERNAL_ERROR"));
    } else {
      await load();
    }
    setPending(null);
  }

  async function addSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!program) return;
    setPending("session");
    setError(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/v1/programs/${program.id}/sessions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        week_number: Number(form.get("week_number")),
        day_index: Number(form.get("day_index")),
        name: form.get("name"),
        estimated_minutes: program.days_per_week ? undefined : 60
      })
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const code = payload?.error?.code ?? "INTERNAL_ERROR";
      setError(tErrors.has(code) ? tErrors(code) : tErrors("INTERNAL_ERROR"));
    } else {
      (event.target as HTMLFormElement).reset();
      await load();
    }
    setPending(null);
  }

  async function addExercise(session: ProgramSession, exercise: PickedExercise) {
    if (!program) return;
    setPending(`ex-${session.id}`);
    const response = await fetch(
      `/api/v1/programs/${program.id}/sessions/${session.id}/exercises`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          exercise_id: exercise.id,
          target_sets: 3,
          target_reps_min: 8,
          target_reps_max: 12,
          rest_seconds: 90
        })
      }
    );
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const code = payload?.error?.code ?? "INTERNAL_ERROR";
      setError(tErrors.has(code) ? tErrors(code) : tErrors("INTERNAL_ERROR"));
    } else {
      await load();
    }
    setPending(null);
  }

  async function removeExercise(session: ProgramSession, item: ProgramExercise) {
    if (!program) return;
    setPending(item.id);
    await fetch(`/api/v1/programs/${program.id}/sessions/${session.id}/exercises/${item.id}`, {
      method: "DELETE"
    });
    await load();
    setPending(null);
  }

  async function startSession(session: ProgramSession) {
    setPending(session.id);
    setError(null);
    const response = await fetch("/api/v1/workouts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ source: "program", program_session_id: session.id })
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const code = payload?.error?.code ?? "INTERNAL_ERROR";
      setError(tErrors.has(code) ? tErrors(code) : tErrors("INTERNAL_ERROR"));
      setPending(null);
      return;
    }
    router.push(`/${locale}/workouts/${payload.data.id}`);
  }

  if (loading) return <p className="text-sm text-muted-foreground">{tCommon("loading")}</p>;
  if (!program) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-danger">{error ?? tErrors("INTERNAL_ERROR")}</p>
        <button
          type="button"
          onClick={load}
          className="rounded-lg border border-border px-3 py-2 text-sm"
        >
          {tCommon("retry")}
        </button>
      </div>
    );
  }

  const sessions = program.weeks.flatMap((week) => week.sessions);
  const completed = sessions.filter((session) => session.completed_at).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t(`status.${program.status}`)}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{program.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t(`splits.${program.split_type}`)} · {program.duration_weeks} {t("weeks")} ·{" "}
            {completed}/{sessions.length} {t("sessionsDone")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {program.status !== "active" ? (
            <button
              type="button"
              onClick={activate}
              disabled={pending === "activate"}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              {t("activate")}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => router.push(`/${locale}/programs`)}
            className="rounded-lg border border-border px-4 py-2 text-sm"
          >
            {t("allPrograms")}
          </button>
        </div>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      {program.ai_generated ? (
        <section className="space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
              {t("aiBadge")}
            </span>
            {program.ai_rationale?.fallback_used ? (
              <span className="rounded bg-amber-500/15 px-2 py-0.5 text-xs text-amber-700 dark:text-amber-400">
                {t("fallbackBadge")}
              </span>
            ) : null}
          </div>
          {program.ai_rationale?.fallback_used ? (
            <p className="text-sm text-amber-700 dark:text-amber-400">{t("fallbackBanner")}</p>
          ) : null}
          {program.ai_rationale?.summary ? (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("rationale")}
              </p>
              <p className="mt-1 text-sm">{program.ai_rationale.summary}</p>
            </div>
          ) : null}
          {program.ai_rationale?.assumptions?.length ? (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("assumptions")}
              </p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                {program.ai_rationale.assumptions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {program.ai_rationale?.safety_notes?.length ? (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("safetyNotes")}
              </p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                {program.ai_rationale.safety_notes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      <AiProgramGenerator
        mode="regenerate"
        programId={program.id}
        defaults={{
          goal: program.goal ?? undefined,
          split_type: program.split_type,
          duration_weeks: program.duration_weeks,
          days_per_week: program.days_per_week,
          session_minutes: program.session_minutes
        }}
      />

      <form
        onSubmit={addSession}
        className="grid gap-2 rounded-xl border border-border bg-card p-4 sm:grid-cols-[1fr_1fr_2fr_auto]"
      >
        <label className="space-y-1 text-xs text-muted-foreground">
          {t("week")}
          <select
            name="week_number"
            className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground"
          >
            {program.weeks.map((week) => (
              <option key={week.id} value={week.week_number}>
                {t("week")} {week.week_number}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-xs text-muted-foreground">
          {t("day")}
          <select
            name="day_index"
            className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground"
          >
            {[1, 2, 3, 4, 5, 6, 7].map((day) => (
              <option key={day} value={day}>
                {t("day")} {day}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-xs text-muted-foreground">
          {t("sessionName")}
          <input
            name="name"
            required
            maxLength={60}
            placeholder={t("sessionNamePlaceholder")}
            className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground"
          />
        </label>
        <button
          type="submit"
          disabled={pending === "session"}
          className="self-end rounded-lg border border-border px-3 py-1.5 text-sm font-medium disabled:opacity-60"
        >
          {t("addSession")}
        </button>
      </form>

      <div className="space-y-4">
        {program.weeks.map((week) => (
          <section key={week.id} className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-medium">
              {t("week")} {week.week_number}
            </h2>
            {week.sessions.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">{t("noSessions")}</p>
            ) : (
              <div className="mt-3 space-y-3">
                {week.sessions.map((session) => (
                  <div key={session.id} className="rounded-lg border border-border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">
                          {t("day")} {session.day_index} · {session.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {session.completed_at ? t("completed") : t("planned")}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => startSession(session)}
                          disabled={pending === session.id || Boolean(session.completed_at)}
                          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-40"
                        >
                          {t("start")}
                        </button>
                        <ExercisePicker
                          label={t("addExercise")}
                          onSelect={(exercise) => addExercise(session, exercise)}
                        />
                      </div>
                    </div>
                    {session.exercises.length ? (
                      <ul className="mt-3 divide-y divide-border rounded-lg border border-border">
                        {session.exercises.map((item) => (
                          <li key={item.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                            <span className="flex-1">{item.exercise_name}</span>
                            <span className="text-xs text-muted-foreground">
                              {item.target_sets} × {item.target_reps_min}-{item.target_reps_max}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeExercise(session, item)}
                              disabled={pending === item.id}
                              className="text-xs text-danger disabled:opacity-40"
                            >
                              {tCommon("remove")}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
