"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

type Exercise = {
  id: string;
  name_id: string;
  name_en: string;
  primary_muscle: string;
  description_id: string | null;
  description_en: string | null;
  instructions_id: string[];
  instructions_en: string[];
  status: "draft" | "published" | "archived";
  updated_at: string;
};

type FormState = {
  name_id: string;
  name_en: string;
  description_id: string;
  description_en: string;
  instructions_id: string;
  instructions_en: string;
  status: "draft" | "published" | "archived";
};

function formFrom(row: Exercise): FormState {
  return {
    name_id: row.name_id,
    name_en: row.name_en,
    description_id: row.description_id ?? "",
    description_en: row.description_en ?? "",
    instructions_id: row.instructions_id.join("\n"),
    instructions_en: row.instructions_en.join("\n"),
    status: row.status
  };
}

export function AdminExerciseEditor() {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const [rows, setRows] = useState<Exercise[]>([]);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function load(search = query) {
    const response = await fetch(
      `/api/v1/admin/exercises?limit=100${search ? `&q=${encodeURIComponent(search)}` : ""}`
    );
    const payload = await response.json();
    if (!response.ok) {
      const code = payload?.error?.code ?? "NETWORK_ERROR";
      setError(tErrors.has(code) ? tErrors(code) : tErrors("NETWORK_ERROR"));
      return;
    }
    setRows(payload.data ?? []);
    if (!selectedId && payload.data?.[0]) {
      setSelectedId(payload.data[0].id);
      setForm(formFrom(payload.data[0]));
    }
  }

  useEffect(() => {
    load()
      .catch(() => setError(tErrors("NETWORK_ERROR")))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function select(row: Exercise) {
    setSelectedId(row.id);
    setForm(formFrom(row));
    setSaved(false);
    setError(null);
  }

  async function save(status?: FormState["status"]) {
    if (!selectedId || !form) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    const response = await fetch(`/api/v1/admin/exercises/${selectedId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name_id: form.name_id,
        name_en: form.name_en,
        description_id: form.description_id || null,
        description_en: form.description_en || null,
        instructions_id: form.instructions_id
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
        instructions_en: form.instructions_en
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
        status: status ?? form.status
      })
    });
    const payload = await response.json();
    setSaving(false);
    if (!response.ok) {
      const code = payload?.error?.code ?? "INTERNAL_ERROR";
      setError(tErrors.has(code) ? tErrors(code) : tErrors("INTERNAL_ERROR"));
      return;
    }
    if (status) setForm((current) => (current ? { ...current, status } : current));
    setSaved(true);
    await load();
  }

  if (loading) return <p className="text-sm text-muted-foreground">{tCommon("loading")}</p>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {saved ? <p className="text-sm text-primary">{t("saved")}</p> : null}

      <div className="grid gap-4 md:grid-cols-[280px_1fr]">
        <aside className="space-y-2">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void load();
            }}
            className="flex gap-1"
          >
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("search")}
              className="min-w-0 flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
            />
            <button type="submit" className="rounded-lg border border-border px-2 py-1.5 text-sm">
              {tCommon("search")}
            </button>
          </form>
          <ul className="max-h-[60vh] space-y-1 overflow-y-auto">
            {rows.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => select(row)}
                  className={`w-full rounded-lg px-2 py-2 text-left text-sm ${
                    row.id === selectedId ? "bg-card font-medium" : "text-muted-foreground"
                  }`}
                >
                  <span className="block truncate">{row.name_id}</span>
                  <span className="text-[10px] uppercase tracking-wide">{row.status}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {form ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void save();
            }}
            className="space-y-3 rounded-xl border border-border bg-card p-4"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-xs text-muted-foreground">
                {t("nameId")}
                <input
                  value={form.name_id}
                  onChange={(event) => setForm({ ...form, name_id: event.target.value })}
                  className="block w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground"
                />
              </label>
              <label className="space-y-1 text-xs text-muted-foreground">
                {t("nameEn")}
                <input
                  value={form.name_en}
                  onChange={(event) => setForm({ ...form, name_en: event.target.value })}
                  className="block w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground"
                />
              </label>
            </div>
            <label className="space-y-1 text-xs text-muted-foreground">
              {t("descriptionId")}
              <textarea
                value={form.description_id}
                onChange={(event) => setForm({ ...form, description_id: event.target.value })}
                rows={2}
                className="block w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground"
              />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              {t("descriptionEn")}
              <textarea
                value={form.description_en}
                onChange={(event) => setForm({ ...form, description_en: event.target.value })}
                rows={2}
                className="block w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-xs text-muted-foreground">
                {t("instructionsId")}
                <textarea
                  value={form.instructions_id}
                  onChange={(event) => setForm({ ...form, instructions_id: event.target.value })}
                  rows={6}
                  className="block w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground"
                />
              </label>
              <label className="space-y-1 text-xs text-muted-foreground">
                {t("instructionsEn")}
                <textarea
                  value={form.instructions_en}
                  onChange={(event) => setForm({ ...form, instructions_en: event.target.value })}
                  rows={6}
                  className="block w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground"
                />
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("status")}: <span className="font-medium text-foreground">{form.status}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {saving ? tCommon("loading") : tCommon("save")}
              </button>
              <button
                type="button"
                disabled={saving || form.status === "published"}
                onClick={() => save("published")}
                className="rounded-lg border border-border px-3 py-2 text-sm disabled:opacity-50"
              >
                {t("publish")}
              </button>
              <button
                type="button"
                disabled={saving || form.status === "draft"}
                onClick={() => save("draft")}
                className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground disabled:opacity-50"
              >
                {t("unpublish")}
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </div>
  );
}
