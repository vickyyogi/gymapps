"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { fromKg, weightUnitLabel, type UnitSystem } from "@gymapps/domain";
import { Link } from "@/i18n/navigation";

type Summary = {
  weekly_logged_workouts: number;
  volume_7d_kg: number;
  volume_30d_kg: number;
  current_streak: number;
  adherence_current_week: number | null;
  total_prs: number;
  last_pr: { exercise_name: string; value: number; unit: string; achieved_at: string } | null;
  previous_period_delta_pct: { volume: number; workouts: number; adherence: number };
  muscle_balance: Array<{ muscle: string; share_pct: number }>;
  insights: string[];
};

type Volume = {
  series: Array<{ week_start: string; volume_kg: number; working_sets: number }>;
  insight: { text: string; delta_pct: number };
};

type Calendar = { days: Array<{ date: string; volume_kg: number; intensity: number }> };
type ActiveWorkout = { id: string; title: string; total_sets: number };
type Program = {
  id: string;
  name: string;
  goal: string | null;
  status: string;
  completion_pct: number;
};
type Profile = { goals: string[]; days_per_week: number | null; equipment: string[] };

function fmt(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function DashboardOverview({
  name,
  unitSystem = "metric"
}: {
  name: string;
  unitSystem?: UnitSystem;
}) {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const unit = weightUnitLabel(unitSystem);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [volume, setVolume] = useState<Volume | null>(null);
  const [calendar, setCalendar] = useState<Calendar | null>(null);
  const [active, setActive] = useState<ActiveWorkout | null>(null);
  const [program, setProgram] = useState<Program | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/v1/analytics/summary?range=4w").then((res) => res.json()),
      fetch("/api/v1/analytics/volume?range=3m").then((res) => res.json()),
      fetch("/api/v1/analytics/calendar?weeks=12").then((res) => res.json()),
      fetch("/api/v1/workouts/active").then((res) => res.json()),
      fetch("/api/v1/programs?status=active&limit=1").then((res) => res.json()),
      fetch("/api/v1/profile").then((res) => res.json())
    ])
      .then(([summaryPayload, volumePayload, calendarPayload, activePayload, programPayload, profilePayload]) => {
        setSummary(summaryPayload.data);
        setVolume(volumePayload.data);
        setCalendar(calendarPayload.data);
        setActive(activePayload.data?.[0] ?? null);
        setProgram(programPayload.data?.[0] ?? null);
        setProfile(profilePayload.data ?? null);
      })
      .catch(() => setError(tErrors("NETWORK_ERROR")))
      .finally(() => setLoading(false));
  }, [tErrors]);

  if (loading) return <p className="text-sm text-muted-foreground">{tCommon("loading")}</p>;
  if (error) return <p className="text-sm text-danger">{error}</p>;
  if (!summary) return null;

  const goalMismatch =
    program?.goal && profile?.goals.length ? !profile.goals.includes(program.goal) : false;
  const maxVolume = Math.max(1, ...(volume?.series.map((item) => item.volume_kg) ?? [0]));
  const weeks = calendar ? Math.ceil(calendar.days.length / 7) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("greeting", { name })}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {active ? (
            <Link
              href={`/workouts/${active.id}`}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              {t("resume")} · {active.total_sets} {t("sets")}
            </Link>
          ) : (
            <Link
              href="/workouts"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              {t("start")}
            </Link>
          )}
          <Link href="/programs" className="rounded-lg border border-border px-4 py-2 text-sm">
            {t("programs")}
          </Link>
        </div>
      </div>

      {goalMismatch ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm">
          <span>
            {t("goalMismatch", {
              goal:
                program?.goal && t.has(`goals.${program.goal}`)
                  ? t(`goals.${program.goal}`)
                  : (program?.goal ?? "")
            })}
          </span>
          <Link href="/onboarding?edit=1" className="font-medium underline underline-offset-4">
            {t("updateGoal")}
          </Link>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          [t("weeklyWorkouts"), String(summary.weekly_logged_workouts)],
          [t("volume7d"), `${fmt(fromKg(summary.volume_7d_kg, unitSystem))} ${unit}`],
          [t("streak"), `${summary.current_streak} ${t("days")}`],
          [
            t("adherence"),
            summary.adherence_current_week === null
              ? "—"
              : `${Math.round(summary.adherence_current_week * 100)}%`
          ]
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      {summary.insights.length ? (
        <div className="flex flex-wrap gap-2">
          {summary.insights.map((insight) => (
            <p key={insight} className="rounded-full bg-muted px-3 py-1.5 text-xs">
              {insight}
            </p>
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-medium">{t("volumeTrend")}</h2>
              <p className="text-xs text-muted-foreground">{volume?.insight.text}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              {volume?.insight.delta_pct
                ? `${volume.insight.delta_pct > 0 ? "+" : ""}${fmt(volume.insight.delta_pct)}%`
                : ""}
            </p>
          </div>
          <div className="mt-4 flex h-36 items-end gap-1.5">
            {(volume?.series ?? []).map((item) => (
              <div key={item.week_start} className="group flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100">
                  {fmt(fromKg(item.volume_kg, unitSystem))}
                </span>
                <div
                  className="w-full rounded-t bg-primary/70"
                  style={{ height: `${Math.max(4, (item.volume_kg / maxVolume) * 120)}px` }}
                  title={`${item.week_start}: ${fmt(fromKg(item.volume_kg, unitSystem))} ${unit}`}
                />
                <span className="text-[10px] text-muted-foreground">
                  {item.week_start.slice(5)}
                </span>
              </div>
            ))}
            {!volume?.series.length ? (
              <p className="self-center text-sm text-muted-foreground">{t("noData")}</p>
            ) : null}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-medium">{t("muscleBalance")}</h2>
          <div className="mt-3 space-y-2">
            {summary.muscle_balance.map((item) => (
              <div key={item.muscle}>
                <div className="flex justify-between text-xs">
                  <span>{t(`muscles.${item.muscle}`)}</span>
                  <span className="text-muted-foreground">{item.share_pct}%</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${Math.min(100, item.share_pct)}%` }}
                  />
                </div>
              </div>
            ))}
            {!summary.muscle_balance.length ? (
              <p className="text-sm text-muted-foreground">{t("noData")}</p>
            ) : null}
          </div>
          {summary.last_pr ? (
            <div className="mt-4 rounded-lg border border-border bg-background p-3">
              <p className="text-xs text-muted-foreground">
                {t("latestPr")} ({summary.total_prs})
              </p>
              <p className="mt-0.5 text-sm font-medium">
                {summary.last_pr.exercise_name} ·{" "}
                {fmt(fromKg(summary.last_pr.value, unitSystem))} {unit}
              </p>
            </div>
          ) : null}
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-medium">{t("activity")}</h2>
          <div
            className="mt-3 grid gap-1"
            style={{ gridTemplateColumns: `repeat(${Math.max(1, weeks)}, minmax(0, 1fr))` }}
          >
            {(calendar?.days ?? []).map((day) => (
              <div
                key={day.date}
                title={`${day.date}: ${fmt(fromKg(day.volume_kg, unitSystem))} ${unit}`}
                className={
                  day.intensity === 0
                    ? "aspect-square rounded-sm bg-muted"
                    : day.intensity === 1
                      ? "aspect-square rounded-sm bg-primary/25"
                      : day.intensity === 2
                        ? "aspect-square rounded-sm bg-primary/45"
                        : day.intensity === 3
                          ? "aspect-square rounded-sm bg-primary/70"
                          : "aspect-square rounded-sm bg-primary"
                }
              />
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-medium">{t("activeProgram")}</h2>
          {program ? (
            <div className="mt-2">
              <Link href={`/programs/${program.id}`} className="font-medium hover:underline">
                {program.name}
              </Link>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("completion")}: {Math.round(program.completion_pct)}%
              </p>
              <div className="mt-2 h-2 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{ width: `${Math.min(100, program.completion_pct)}%` }}
                />
              </div>
              <Link
                href="/programs"
                className="mt-3 inline-block text-xs font-medium underline underline-offset-4"
              >
                {t("managePrograms")}
              </Link>
            </div>
          ) : (
            <div className="mt-2 space-y-2">
              <p className="text-sm text-muted-foreground">{t("noProgram")}</p>
              <Link href="/programs" className="inline-block text-sm font-medium underline underline-offset-4">
                {t("createProgram")}
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
