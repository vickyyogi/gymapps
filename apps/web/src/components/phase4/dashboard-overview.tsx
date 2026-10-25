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

  if (loading) return <p className="text-body text-text-tertiary animate-fade-in">{tCommon("loading")}</p>;
  if (error) return <p className="text-body text-error animate-fade-in">{error}</p>;
  if (!summary) return null;

  const goalMismatch =
    program?.goal && profile?.goals.length ? !profile.goals.includes(program.goal) : false;
  const maxVolume = Math.max(1, ...(volume?.series.map((item) => item.volume_kg) ?? [0]));
  const weeks = calendar ? Math.ceil(calendar.days.length / 7) : 0;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-headline">{t("title")}</h1>
          <p className="mt-1 text-body-small text-text-secondary">{t("greeting", { name })}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {active ? (
            <Link
              href={`/workouts/${active.id}`}
              className="btn btn-primary btn-md"
            >
              {t("resume")} · {active.total_sets} {t("sets")}
            </Link>
          ) : (
            <Link
              href="/workouts"
              className="btn btn-primary btn-md"
            >
              {t("start")}
            </Link>
          )}
          <Link href="/programs" className="btn btn-secondary btn-md">
            {t("programs")}
          </Link>
        </div>
      </div>

      {/* Goal Mismatch Alert */}
      {goalMismatch ? (
        <div className="card border-primary/30 bg-primary-light/50 animate-slide-up">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-body-small text-text-primary">
              {t("goalMismatch", {
                goal:
                  program?.goal && t.has(`goals.${program.goal}`)
                    ? t(`goals.${program.goal}`)
                    : (program?.goal ?? "")
              })}
            </span>
            <Link href="/onboarding?edit=1" className="text-body-small font-medium underline underline-offset-4 text-primary hover:text-primary-hover">
              {t("updateGoal")}
            </Link>
          </div>
        </div>
      ) : null}

      {/* Key Metrics Grid - 2-column on mobile, 4-column on desktop */}
      <div className="dashboard-grid">
        {[
          [t("weeklyWorkouts"), String(summary.weekly_logged_workouts), "metric-primary"],
          [t("volume7d"), `${fmt(fromKg(summary.volume_7d_kg, unitSystem))} ${unit}`, "metric-primary"],
          [t("streak"), `${summary.current_streak} ${t("days")}`, "metric-positive"],
          [
            t("adherence"),
            summary.adherence_current_week === null
              ? "—"
              : `${Math.round(summary.adherence_current_week * 100)}%`,
            "metric-positive"
          ]
        ].map(([label, value, metricColor]) => (
          <div key={label} className="metric-widget">
            <p className="text-overline text-text-secondary">{label}</p>
            <p className="metric-value text-[22px] mt-1" style={{ color: `var(--color-${metricColor})` }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Insights */}
      {summary.insights.length ? (
        <div className="flex flex-wrap gap-2 animate-fade-in">
          {summary.insights.map((insight) => (
            <span key={insight} className="chip chip-filter">
              {insight}
            </span>
          ))}
        </div>
      ) : null}

      {/* Volume Trend & Muscle Balance */}
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* Volume Trend */}
        <section className="card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-subhead">{t("volumeTrend")}</h2>
              <p className="text-caption text-text-secondary mt-0.5">{volume?.insight.text}</p>
            </div>
            {volume?.insight.delta_pct !== undefined && (
              <p className="text-caption text-text-secondary whitespace-nowrap">
                {volume.insight.delta_pct > 0 ? "+" : ""}{fmt(volume.insight.delta_pct)}%
              </p>
            )}
          </div>
          <div className="mt-4 flex h-36 items-end gap-1.5">
            {(volume?.series ?? []).map((item) => (
              <div key={item.week_start} className="group flex flex-1 flex-col items-center gap-1">
                <span className="text-overline text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity">
                  {fmt(fromKg(item.volume_kg, unitSystem))}
                </span>
                <div
                  className="w-full rounded-t bg-primary/70"
                  style={{ height: `${Math.max(4, (item.volume_kg / maxVolume) * 120)}px` }}
                  title={`${item.week_start}: ${fmt(fromKg(item.volume_kg, unitSystem))} ${unit}`}
                />
                <span className="text-overline text-text-tertiary">
                  {item.week_start.slice(5)}
                </span>
              </div>
            ))}
            {!volume?.series.length ? (
              <p className="self-center text-body text-text-tertiary">{t("noData")}</p>
            ) : null}
          </div>
        </section>

        {/* Muscle Balance */}
        <section className="card">
          <h2 className="text-subhead">{t("muscleBalance")}</h2>
          <div className="mt-3 space-y-2">
            {summary.muscle_balance.map((item) => (
              <div key={item.muscle} className="animate-fade-in">
                <div className="flex justify-between text-caption">
                  <span className="text-text-primary">{t(`muscles.${item.muscle}`)}</span>
                  <span className="text-text-secondary font-medium">{item.share_pct}%</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-border" role="progressbar" aria-valuenow={item.share_pct} aria-valuemin={0} aria-valuemax={100}>
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${Math.min(100, item.share_pct)}%` }}
                  />
                </div>
              </div>
            ))}
            {!summary.muscle_balance.length ? (
              <p className="text-body text-text-tertiary">{t("noData")}</p>
            ) : null}
          </div>
          {summary.last_pr ? (
            <div className="mt-4 card-elevated">
              <p className="text-caption text-text-secondary">
                {t("lastPr")} ({summary.total_prs})
              </p>
              <p className="mt-0.5 text-body font-medium text-text-primary">
                {summary.last_pr.exercise_name} ·{" "}
                {fmt(fromKg(summary.last_pr.value, unitSystem))} {unit}
              </p>
            </div>
          ) : null}
        </section>
      </div>

      {/* Calendar Heatmap & Active Program */}
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* Calendar Heatmap */}
        <section className="card">
          <h2 className="text-subhead">{t("calendar")}</h2>
          <div
            className="calendar-heatmap mt-3"
            style={{ gridTemplateColumns: `repeat(${Math.max(1, weeks)}, minmax(0, 1fr))` }}
            role="img"
            aria-label={t("calendarAriaLabel", { weeks })}
          >
            {(calendar?.days ?? []).map((day) => (
              <div
                key={day.date}
                title={`${day.date}: ${fmt(fromKg(day.volume_kg, unitSystem))} ${unit}`}
                className="calendar-day transition-fast"
                style={{
                  backgroundColor:
                    day.intensity === 0
                      ? "var(--color-border)"
                      : day.intensity === 1
                      ? "var(--color-primary-light)"
                      : day.intensity === 2
                      ? "#A5B4FC"
                      : day.intensity === 3
                      ? "#818CF8"
                      : "var(--color-primary)"
                }}
              />
            ))}
          </div>
        </section>

        {/* Active Program */}
        <section className="card">
          <h2 className="text-subhead">{t("activeProgram")}</h2>
          {program ? (
            <div className="mt-2 space-y-3">
              <Link href={`/programs/${program.id}`} className="font-medium hover:underline text-text-primary">
                {program.name}
              </Link>
              <div>
                <div className="flex justify-between text-caption mb-1">
                  <span className="text-text-secondary">{t("completion")}</span>
                  <span className="text-text-primary font-medium">{Math.round(program.completion_pct)}%</span>
                </div>
                <div className="progress" role="progressbar" aria-valuenow={program.completion_pct} aria-valuemin={0} aria-valuemax={100}>
                  <div
                    className="progress-bar progress-bar-primary"
                    style={{ width: `${Math.min(100, program.completion_pct)}%` }}
                  />
                </div>
              </div>
              <Link
                href="/programs"
                className="text-caption font-medium underline underline-offset-4 text-primary hover:text-primary-hover inline-block"
              >
                {t("managePrograms")}
              </Link>
            </div>
          ) : (
            <div className="mt-2 space-y-2 text-center py-4">
              <p className="text-body text-text-tertiary">{t("noProgram")}</p>
              <Link href="/programs" className="btn btn-primary btn-sm">
                {t("createProgram")}
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}