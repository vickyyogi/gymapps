"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type Recommendation = {
  id: string;
  rule: string;
  severity: "P1" | "P2" | "P3";
  title: string;
  body: string | null;
  evidence: {
    metric?: string;
    value?: number;
    unit?: string;
    delta_pct?: number | null;
    series?: Array<{ week?: string; volume_kg?: number; ratio?: number; est_1rm_kg?: number }>;
    [key: string]: unknown;
  };
  action_type: string | null;
  action_payload: { program_id?: string | null; exercise_id?: string | null } | null;
  status: string;
  created_at: string;
};

function evidenceRows(row: Recommendation) {
  const series = row.evidence.series ?? [];
  const values = series
    .map((item) => Number(item.volume_kg ?? item.ratio ?? item.est_1rm_kg ?? 0))
    .filter((value) => Number.isFinite(value));
  return { series, values };
}

export function RecommendationsList() {
  const t = useTranslations("recommendations");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const locale = useLocale();
  const [rows, setRows] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  const load = useCallback(async () => {
    const response = await fetch("/api/v1/ai/recommendations?limit=50");
    const payload = await response.json();
    if (!response.ok) {
      const code = payload?.error?.code ?? "NETWORK_ERROR";
      setError(tErrors.has(code) ? tErrors(code) : tErrors("NETWORK_ERROR"));
      return;
    }
    setRows(payload.data ?? []);
  }, [tErrors]);

  useEffect(() => {
    load()
      .catch(() => setError(tErrors("NETWORK_ERROR")))
      .finally(() => setLoading(false));
  }, [load, tErrors]);

  async function update(row: Recommendation, status: "read" | "dismissed" | "acted") {
    setPending(row.id);
    const response = await fetch(`/api/v1/ai/recommendations/${row.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status })
    });
    if (response.ok) {
      setRows((current) =>
        status === "dismissed"
          ? current.filter((item) => item.id !== row.id)
          : current.map((item) => (item.id === row.id ? { ...item, status } : item))
      );
    }
    setPending(null);
  }

  if (loading) return <p className="text-sm text-muted-foreground">{tCommon("loading")}</p>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {!rows.length ? <p className="text-sm text-muted-foreground">{t("empty")}</p> : null}
      <ul className="space-y-3">
        {rows.map((row) => {
          const { series, values } = evidenceRows(row);
          const max = Math.max(...values, 1);
          const actionHref =
            row.action_type === "view_exercise" && row.action_payload?.exercise_id
              ? `/exercises?focus=${encodeURIComponent(row.action_payload.exercise_id)}`
              : row.action_payload?.program_id
                ? `/programs/${row.action_payload.program_id}`
                : null;
          return (
            <li key={row.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        row.severity === "P1"
                          ? "bg-danger/10 text-danger"
                          : row.severity === "P2"
                            ? "bg-amber-500/10 text-amber-600"
                            : "bg-primary/10 text-primary"
                      }`}
                    >
                      {row.severity}
                    </span>
                    <span className="text-xs text-muted-foreground">{t(`rules.${row.rule}`)}</span>
                  </div>
                  <h2 className="mt-1 text-base font-medium">{row.title}</h2>
                </div>
                <time className="text-xs text-muted-foreground">
                  {new Date(row.created_at).toLocaleDateString(locale === "en" ? "en-US" : "id-ID")}
                </time>
              </div>
              {row.body ? <p className="mt-2 text-sm text-muted-foreground">{row.body}</p> : null}

              {series.length > 0 ? (
                <div className="mt-3 flex h-16 items-end gap-1" aria-label={t("evidence")}>
                  {series.map((item, index) => {
                    const value = Number(item.volume_kg ?? item.ratio ?? item.est_1rm_kg ?? 0);
                    return (
                      <div
                        key={`${row.id}-${index}`}
                        className="flex-1 rounded-t bg-primary/60"
                        style={{ height: `${Math.max(4, (value / max) * 56)}px` }}
                        title={`${item.week ?? ""} ${value}`}
                      />
                    );
                  })}
                </div>
              ) : null}

              <dl className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                {row.evidence.metric ? (
                  <div>
                    <dt className="inline">{t("metric")}: </dt>
                    <dd className="inline font-medium text-foreground">{row.evidence.metric}</dd>
                  </div>
                ) : null}
                {typeof row.evidence.value === "number" ? (
                  <div>
                    <dt className="inline">{t("value")}: </dt>
                    <dd className="inline font-medium text-foreground">
                      {row.evidence.value}
                      {row.evidence.unit ? ` ${row.evidence.unit}` : ""}
                    </dd>
                  </div>
                ) : null}
                {typeof row.evidence.delta_pct === "number" ? (
                  <div>
                    <dt className="inline">{t("delta")}: </dt>
                    <dd className="inline font-medium text-foreground">
                      {row.evidence.delta_pct > 0 ? "+" : ""}
                      {row.evidence.delta_pct}%
                    </dd>
                  </div>
                ) : null}
              </dl>

              <div className="mt-3 flex flex-wrap gap-2">
                {actionHref ? (
                  <Link
                    href={actionHref}
                    onClick={() => update(row, "acted")}
                    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                  >
                    {t("openAction")}
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={() => update(row, "read")}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs"
                >
                  {t("markRead")}
                </button>
                <button
                  type="button"
                  onClick={() => update(row, "dismissed")}
                  disabled={pending === row.id}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground disabled:opacity-50"
                >
                  {t("dismiss")}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
