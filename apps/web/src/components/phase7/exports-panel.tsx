"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

type ExportRow = {
  export_id: string;
  status: "queued" | "running" | "ready" | "failed";
  type: "csv" | "json" | "pdf_report";
  download_url: string | null;
  expires_at: string | null;
  file_size_bytes: number | null;
  expired: boolean;
  error_message: string | null;
  created_at?: string;
};

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function size(value: number | null) {
  if (value === null) return "—";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function ExportsPanel() {
  const t = useTranslations("exports");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const [rows, setRows] = useState<ExportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [month, setMonth] = useState(currentMonth());

  const load = useCallback(async () => {
    const response = await fetch("/api/v1/exports");
    const payload = await response.json();
    if (!response.ok) throw new Error(payload?.error?.code ?? "NETWORK_ERROR");
    setRows(payload.data ?? []);
  }, []);

  useEffect(() => {
    load()
      .catch(() => setError(tErrors("NETWORK_ERROR")))
      .finally(() => setLoading(false));
  }, [load, tErrors]);

  useEffect(() => {
    if (!rows.some((row) => row.status === "queued" || row.status === "running")) return;
    const timer = setInterval(() => {
      void load().catch(() => undefined);
    }, 1500);
    return () => clearInterval(timer);
  }, [rows, load]);

  async function create(format: "csv" | "json") {
    setPending(format);
    setError(null);
    try {
      const response = await fetch("/api/v1/exports", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ format })
      });
      const payload = await response.json();
      if (!response.ok) {
        const code = payload?.error?.code ?? "INTERNAL_ERROR";
        setError(tErrors.has(code) ? tErrors(code) : tErrors("INTERNAL_ERROR"));
        return;
      }
      setRows((current) => [
        {
          export_id: payload.data.export_id,
          status: payload.data.status,
          type: format,
          download_url: null,
          expires_at: null,
          file_size_bytes: null,
          expired: false,
          error_message: null
        },
        ...current
      ]);
    } finally {
      setPending(null);
    }
  }

  async function createReport() {
    setPending("pdf");
    setError(null);
    try {
      const response = await fetch("/api/v1/reports", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ month, include_body_metrics: true })
      });
      const payload = await response.json();
      if (!response.ok) {
        const code = payload?.error?.code ?? "INTERNAL_ERROR";
        setError(tErrors.has(code) ? tErrors(code) : tErrors("INTERNAL_ERROR"));
        return;
      }
      setRows((current) => [
        {
          export_id: payload.data.report_id,
          status: payload.data.status,
          type: "pdf_report",
          download_url: null,
          expires_at: null,
          file_size_bytes: null,
          expired: false,
          error_message: null
        },
        ...current
      ]);
    } finally {
      setPending(null);
    }
  }

  async function remove(id: string) {
    setPending(id);
    await fetch(`/api/v1/exports/${id}`, { method: "DELETE" });
    setRows((current) => current.filter((row) => row.export_id !== id));
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

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-medium">{t("createTitle")}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending !== null}
            onClick={() => create("json")}
            className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {pending === "json" ? tCommon("loading") : t("json")}
          </button>
          <button
            type="button"
            disabled={pending !== null}
            onClick={() => create("csv")}
            className="rounded-lg border border-border px-3 py-2 text-sm disabled:opacity-50"
          >
            {pending === "csv" ? tCommon("loading") : t("csv")}
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{t("ttlHint")}</p>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-medium">{t("reportTitle")}</h2>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <label className="space-y-1 text-xs text-muted-foreground">
            {t("month")}
            <input
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              className="block rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground"
            />
          </label>
          <button
            type="button"
            disabled={pending !== null}
            onClick={createReport}
            className="rounded-lg border border-border px-3 py-2 text-sm disabled:opacity-50"
          >
            {pending === "pdf" ? tCommon("loading") : t("pdf")}
          </button>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium">{t("history")}</h2>
        <ul className="space-y-2">
          {rows.map((row) => (
            <li
              key={row.export_id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card p-3 text-sm"
            >
              <div>
                <p className="font-medium">
                  {row.type === "pdf_report" ? t("pdf") : row.type.toUpperCase()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t(`status.${row.status}`)}
                  {row.file_size_bytes !== null ? ` · ${size(row.file_size_bytes)}` : ""}
                  {row.expires_at
                    ? ` · ${t("expires", { date: new Date(row.expires_at).toLocaleDateString() })}`
                    : ""}
                </p>
                {row.expired ? <p className="text-xs text-danger">{t("expired")}</p> : null}
                {row.error_message ? <p className="text-xs text-danger">{row.error_message}</p> : null}
              </div>
              <div className="flex gap-2">
                {row.download_url ? (
                  <a
                    href={row.download_url}
                    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                  >
                    {t("download")}
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={() => remove(row.export_id)}
                  disabled={pending === row.export_id}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground disabled:opacity-50"
                >
                  {tCommon("remove")}
                </button>
              </div>
            </li>
          ))}
          {!rows.length ? (
            <li className="rounded-xl border border-border bg-card p-3 text-sm text-muted-foreground">
              {t("empty")}
            </li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
