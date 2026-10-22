"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";

type BodyMetric = {
  id: string;
  recorded_on: string;
  weight_kg: number | null;
  body_fat_pct: number | null;
  waist_cm: number | null;
  notes: string | null;
};

type Note = {
  id: string;
  body: string;
  category: string;
  is_pinned: boolean;
  created_at: string;
};

const CATEGORIES = ["general", "injury", "nutrition", "mood", "equipment"];

function today() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
}

function fmt(value: number | null) {
  return value === null ? "—" : Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function ProgressTracker() {
  const t = useTranslations("progress");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const [metrics, setMetrics] = useState<BodyMetric[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = useCallback(async () => {
    const response = await fetch("/api/v1/body-metrics?limit=90");
    const payload = await response.json();
    setMetrics(payload.data ?? []);
  }, []);

  const loadNotes = useCallback(async (cursor?: string) => {
    const response = await fetch(`/api/v1/notes?limit=30${cursor ? `&cursor=${cursor}` : ""}`);
    const payload = await response.json();
    setNotes((current) => (cursor ? [...current, ...(payload.data ?? [])] : payload.data ?? []));
    setNextCursor(payload.nextCursor ?? null);
  }, []);

  useEffect(() => {
    Promise.all([loadMetrics(), loadNotes()])
      .catch(() => setError(tErrors("NETWORK_ERROR")))
      .finally(() => setLoading(false));
  }, [loadMetrics, loadNotes, tErrors]);

  async function saveMetric(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending("metric");
    setError(null);
    const form = new FormData(event.currentTarget);
    const value = (name: string) => {
      const raw = String(form.get(name) ?? "").trim();
      return raw ? Number(raw) : undefined;
    };
    try {
      const response = await fetch("/api/v1/body-metrics", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          recorded_on: form.get("recorded_on"),
          ...(value("weight_kg") !== undefined ? { weight_kg: value("weight_kg") } : {}),
          ...(value("body_fat_pct") !== undefined ? { body_fat_pct: value("body_fat_pct") } : {}),
          ...(value("waist_cm") !== undefined ? { waist_cm: value("waist_cm") } : {}),
          ...(String(form.get("notes") ?? "").trim()
            ? { notes: String(form.get("notes")).trim() }
            : {})
        })
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const code = payload?.error?.code ?? "INTERNAL_ERROR";
        setError(tErrors.has(code) ? tErrors(code) : tErrors("INTERNAL_ERROR"));
        return;
      }
      (event.target as HTMLFormElement).reset();
      await loadMetrics();
    } finally {
      setPending(null);
    }
  }

  async function saveNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending("note");
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/v1/notes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          body: form.get("body"),
          category: form.get("category"),
          is_pinned: form.get("is_pinned") === "on"
        })
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const code = payload?.error?.code ?? "INTERNAL_ERROR";
        setError(tErrors.has(code) ? tErrors(code) : tErrors("INTERNAL_ERROR"));
        return;
      }
      (event.target as HTMLFormElement).reset();
      await loadNotes();
    } finally {
      setPending(null);
    }
  }

  async function togglePin(note: Note) {
    setPending(note.id);
    await fetch(`/api/v1/notes/${note.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ is_pinned: !note.is_pinned })
    });
    await loadNotes();
    setPending(null);
  }

  async function removeNote(note: Note) {
    setPending(note.id);
    await fetch(`/api/v1/notes/${note.id}`, { method: "DELETE" });
    await loadNotes();
    setPending(null);
  }

  async function removeMetric(metric: BodyMetric) {
    setPending(metric.id);
    await fetch(`/api/v1/body-metrics/${metric.id}`, { method: "DELETE" });
    await loadMetrics();
    setPending(null);
  }

  const latest = metrics[0];
  const previous = metrics[1];
  const weightDelta =
    latest?.weight_kg !== null && previous?.weight_kg !== null && latest && previous
      ? Number(latest.weight_kg) - Number(previous.weight_kg)
      : null;
  const chart = [...metrics].reverse().filter((metric) => metric.weight_kg !== null).slice(-20);
  const weights = chart.map((metric) => Number(metric.weight_kg));
  const minWeight = Math.min(...weights, Infinity);
  const maxWeight = Math.max(...weights, -Infinity);

  if (loading) return <p className="text-sm text-muted-foreground">{tCommon("loading")}</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <div className="grid grid-cols-3 gap-2">
        {[
          [t("weight"), latest?.weight_kg !== null && latest ? `${fmt(latest.weight_kg)} kg` : "—"],
          [
            t("bodyFat"),
            latest?.body_fat_pct !== null && latest ? `${fmt(latest.body_fat_pct)}%` : "—"
          ],
          [t("waist"), latest?.waist_cm !== null && latest ? `${fmt(latest.waist_cm)} cm` : "—"]
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-xl font-semibold">{value}</p>
            {label === t("weight") && weightDelta !== null ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {weightDelta > 0 ? "+" : ""}
                {fmt(weightDelta)} kg
              </p>
            ) : null}
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-medium">{t("bodyMetrics")}</h2>
          <form onSubmit={saveMetric} className="mt-3 grid grid-cols-2 gap-2">
            <label className="space-y-1 text-xs text-muted-foreground">
              {t("date")}
              <input
                name="recorded_on"
                type="date"
                required
                defaultValue={today()}
                className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground"
              />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              {t("weightKg")}
              <input
                name="weight_kg"
                type="number"
                step="0.1"
                min={20}
                max={500}
                className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground"
              />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              {t("bodyFatPct")}
              <input
                name="body_fat_pct"
                type="number"
                step="0.1"
                min={1}
                max={70}
                className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground"
              />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              {t("waistCm")}
              <input
                name="waist_cm"
                type="number"
                step="0.1"
                min={1}
                className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground"
              />
            </label>
            <label className="col-span-2 space-y-1 text-xs text-muted-foreground">
              {t("notes")}
              <input
                name="notes"
                maxLength={1000}
                className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground"
              />
            </label>
            <button
              type="submit"
              disabled={pending === "metric"}
              className="col-span-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              {pending === "metric" ? tCommon("loading") : tCommon("save")}
            </button>
          </form>

          {chart.length > 1 && minWeight !== maxWeight ? (
            <div className="mt-4 flex h-20 items-end gap-1">
              {chart.map((metric) => (
                <div
                  key={metric.id}
                  className="flex-1 rounded-t bg-primary/60"
                  style={{
                    height: `${20 + ((Number(metric.weight_kg) - minWeight) / (maxWeight - minWeight)) * 60}px`
                  }}
                  title={`${metric.recorded_on}: ${fmt(metric.weight_kg)} kg`}
                />
              ))}
            </div>
          ) : null}

          <ul className="mt-3 divide-y divide-border text-sm">
            {metrics.slice(0, 8).map((metric) => (
              <li key={metric.id} className="flex items-center justify-between gap-2 py-2">
                <span className="text-muted-foreground">{metric.recorded_on}</span>
                <span>
                  {metric.weight_kg !== null ? `${fmt(metric.weight_kg)} kg` : "—"}
                  {metric.body_fat_pct !== null ? ` · ${fmt(metric.body_fat_pct)}%` : ""}
                </span>
                <button
                  type="button"
                  onClick={() => removeMetric(metric)}
                  disabled={pending === metric.id}
                  className="text-xs text-danger disabled:opacity-40"
                >
                  {tCommon("remove")}
                </button>
              </li>
            ))}
            {!metrics.length ? (
              <li className="py-2 text-muted-foreground">{t("noMetrics")}</li>
            ) : null}
          </ul>
        </section>

        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-medium">{t("notesTitle")}</h2>
          <form onSubmit={saveNote} className="mt-3 space-y-2">
            <textarea
              name="body"
              required
              maxLength={5000}
              rows={3}
              placeholder={t("notePlaceholder")}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <div className="flex flex-wrap items-center gap-2">
              <select
                name="category"
                className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {t(`categories.${category}`)}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-1.5 text-xs">
                <input name="is_pinned" type="checkbox" />
                {t("pin")}
              </label>
              <button
                type="submit"
                disabled={pending === "note"}
                className="ml-auto rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
              >
                {pending === "note" ? tCommon("loading") : tCommon("save")}
              </button>
            </div>
          </form>

          <ul className="mt-4 space-y-2">
            {notes.map((note) => (
              <li key={note.id} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">
                    {t(`categories.${note.category}`)} ·{" "}
                    {new Date(note.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => togglePin(note)}
                      disabled={pending === note.id}
                      className="text-xs text-muted-foreground disabled:opacity-40"
                    >
                      {note.is_pinned ? t("unpin") : t("pin")}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeNote(note)}
                      disabled={pending === note.id}
                      className="text-xs text-danger disabled:opacity-40"
                    >
                      {tCommon("remove")}
                    </button>
                  </div>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm">{note.body}</p>
              </li>
            ))}
            {!notes.length ? (
              <li className="py-2 text-sm text-muted-foreground">{t("noNotes")}</li>
            ) : null}
          </ul>
          {nextCursor ? (
            <button
              type="button"
              onClick={() => loadNotes(nextCursor)}
              className="mt-3 text-sm font-medium underline underline-offset-4"
            >
              {tCommon("loadMore")}
            </button>
          ) : null}
        </section>
      </div>
    </div>
  );
}
