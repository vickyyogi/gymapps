"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { fromKg, weightUnitLabel, type UnitSystem } from "@gymapps/domain";

type Exercise = {
  id: string;
  name_id: string;
  name_en: string;
  description_id: string | null;
  description_en: string | null;
  primary_muscle: string;
  secondary_muscles: string[];
  equipment: string[];
  difficulty: string;
  is_compound: boolean;
  source: string;
  owner_user_id?: string | null;
};

type ExerciseDetail = Exercise & {
  instructions_id: string[];
  instructions_en: string[];
  stats: {
    last_performed_at: string | null;
    session_count: number;
    best_set: string | null;
    best_est_1rm_kg: number | null;
    volume_30d_kg: number;
  };
};

const MUSCLES = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "forearms",
  "quads",
  "hamstrings",
  "glutes",
  "calves",
  "abs",
  "obliques",
  "lats",
  "traps",
  "lower_back",
  "full_body",
  "cardio",
  "core"
];

const EQUIPMENT_LIST = [
  "bodyweight",
  "dumbbell",
  "barbell",
  "machine",
  "cable",
  "bench",
  "pullup_bar",
  "kettlebell",
  "resistance_band",
  "cardio_machine",
  "smith_machine",
  "dip_bar",
  "landmine",
  "sled",
  "other"
];

const DIFFICULTY = ["beginner", "intermediate", "advanced"];

function fmt(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function ExerciseLibrary({ unitSystem = "metric" }: { unitSystem?: UnitSystem }) {
  const t = useTranslations("exercises");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const locale = useLocale();
  const router = useRouter();
  const unit = weightUnitLabel(unitSystem);

  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [rows, setRows] = useState<Exercise[]>([]);
  const [activeWorkout, setActiveWorkout] = useState<{ id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detail modal state
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<ExerciseDetail | null>(null);

  // Custom exercise form modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nameId, setNameId] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [primaryMuscle, setPrimaryMuscle] = useState("chest");
  const [secondaryMuscles, setSecondaryMuscles] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>(["dumbbell"]);
  const [selectedDifficulty, setSelectedDifficulty] = useState("intermediate");
  const [descriptionId, setDescriptionId] = useState("");
  const [instructionsText, setInstructionsText] = useState("");
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/workouts/active")
      .then((res) => res.json())
      .then((payload) => setActiveWorkout(payload.data?.[0] ?? null))
      .catch(() => null);
  }, []);

  const loadExercises = useCallback(() => {
    const params = new URLSearchParams({ limit: "60" });
    if (query.trim()) params.set("q", query.trim());
    if (muscle) params.set("muscle", muscle);
    if (difficulty) params.set("difficulty", difficulty);
    if (availableOnly) params.set("available_only", "true");

    setLoading(true);
    setError(null);
    fetch(`/api/v1/exercises?${params.toString()}`)
      .then((res) => res.json())
      .then((payload) => setRows(payload.data ?? []))
      .catch(() => setError(tErrors("NETWORK_ERROR")))
      .finally(() => setLoading(false));
  }, [query, muscle, difficulty, availableOnly, tErrors]);

  useEffect(() => {
    loadExercises();
  }, [loadExercises]);

  async function addToWorkout(exercise: Exercise) {
    if (!activeWorkout) return;
    const response = await fetch(`/api/v1/workouts/${activeWorkout.id}/exercises`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ exercise_id: exercise.id })
    });
    if (response.ok) {
      router.push(`/${locale}/workouts/${activeWorkout.id}`);
    }
  }

  async function openDetail(exerciseId: string) {
    setDetailLoading(true);
    setDetail(null);
    setError(null);
    try {
      const response = await fetch(`/api/v1/exercises/${exerciseId}`);
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const code = payload?.error?.code ?? "INTERNAL_ERROR";
        setError(tErrors.has(code) ? tErrors(code) : tErrors("INTERNAL_ERROR"));
        return;
      }
      setDetail(payload.data);
    } catch {
      setError(tErrors("NETWORK_ERROR"));
    } finally {
      setDetailLoading(false);
    }
  }

  function openCreateModal() {
    setEditingId(null);
    setNameId("");
    setNameEn("");
    setPrimaryMuscle("chest");
    setSecondaryMuscles([]);
    setSelectedEquipment(["dumbbell"]);
    setSelectedDifficulty("intermediate");
    setDescriptionId("");
    setInstructionsText("");
    setFormError(null);
    setFormOpen(true);
  }

  async function openEditModal(exercise: Exercise) {
    setEditingId(exercise.id);
    setNameId(exercise.name_id);
    setNameEn(exercise.name_en);
    setPrimaryMuscle(exercise.primary_muscle);
    setSecondaryMuscles(exercise.secondary_muscles ?? []);
    setSelectedEquipment(exercise.equipment.length ? exercise.equipment : ["bodyweight"]);
    setSelectedDifficulty(exercise.difficulty);
    setDescriptionId(exercise.description_id ?? "");
    setInstructionsText("");
    setFormError(null);
    setFormOpen(true);

    try {
      const res = await fetch(`/api/v1/exercises/${exercise.id}`);
      const payload = await res.json().catch(() => null);
      if (res.ok && payload?.data?.instructions_id) {
        setInstructionsText((payload.data.instructions_id as string[]).join("\n"));
      }
    } catch {
      // Keep default empty instructions if detail fetch fails
    }
  }

  function toggleArrayItem(list: string[], value: string, setter: (next: string[]) => void) {
    setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  }

  async function submitCustomExercise(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedEquipment.length === 0) {
      setFormError(t("equipmentRequired"));
      return;
    }

    setFormSaving(true);
    setFormError(null);

    const instructions = instructionsText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 6);

    const body = {
      name_id: nameId.trim(),
      ...(nameEn.trim() ? { name_en: nameEn.trim() } : {}),
      primary_muscle: primaryMuscle,
      secondary_muscles: secondaryMuscles.filter((m) => m !== primaryMuscle),
      equipment: selectedEquipment,
      difficulty: selectedDifficulty,
      ...(descriptionId.trim() ? { description_id: descriptionId.trim() } : {}),
      instructions_id: instructions
    };

    try {
      const response = await fetch(
        editingId ? `/api/v1/exercises/${editingId}` : "/api/v1/exercises",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body)
        }
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const code = payload?.error?.code ?? "INTERNAL_ERROR";
        setFormError(tErrors.has(code) ? tErrors(code) : tErrors("INTERNAL_ERROR"));
        return;
      }
      setFormOpen(false);
      if (detail && detail.id === editingId) {
        await openDetail(editingId);
      }
      loadExercises();
    } catch {
      setFormError(tErrors("NETWORK_ERROR"));
    } finally {
      setFormSaving(false);
    }
  }

  async function deleteCustomExercise(exerciseId: string) {
    setError(null);
    try {
      const response = await fetch(`/api/v1/exercises/${exerciseId}`, {
        method: "DELETE"
      });
      if (!response.ok && response.status !== 204) {
        const payload = await response.json().catch(() => null);
        const code = payload?.error?.code ?? "INTERNAL_ERROR";
        setError(tErrors.has(code) ? tErrors(code) : tErrors("INTERNAL_ERROR"));
        return;
      }
      if (detail?.id === exerciseId) {
        setDetail(null);
      }
      loadExercises();
    } catch {
      setError(tErrors("NETWORK_ERROR"));
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("libraryTitle")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("libraryDescription")}</p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          + {t("createCustom")}
        </button>
      </div>

      <div className="grid gap-2 sm:grid-cols-4">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("searchPlaceholder")}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm sm:col-span-2"
        />
        <select
          value={muscle}
          onChange={(event) => setMuscle(event.target.value)}
          aria-label={t("muscleFilter")}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">{t("allMuscles")}</option>
          {MUSCLES.map((item) => (
            <option key={item} value={item}>
              {t(`muscles.${item}`)}
            </option>
          ))}
        </select>
        <select
          value={difficulty}
          onChange={(event) => setDifficulty(event.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">{t("allLevels")}</option>
          {DIFFICULTY.map((item) => (
            <option key={item} value={item}>
              {t(`levels.${item}`)}
            </option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={availableOnly}
          onChange={(event) => setAvailableOnly(event.target.checked)}
        />
        {t("availableOnly")}
      </label>

      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      {loading ? <p className="text-sm text-muted-foreground">{tCommon("loading")}</p> : null}

      {!loading && rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {t("empty")}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {rows.map((exercise) => {
          const primaryName = locale === "en" ? exercise.name_en : exercise.name_id;
          const secondaryName = locale === "en" ? exercise.name_id : exercise.name_en;
          return (
            <article key={exercise.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <button
                    type="button"
                    onClick={() => openDetail(exercise.id)}
                    className="text-left font-medium hover:underline"
                  >
                    {primaryName}
                  </button>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {secondaryName !== primaryName ? secondaryName : null}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {exercise.source === "custom" ? (
                    <span className="rounded bg-primary/15 px-1.5 py-0.5 text-xs font-medium text-primary">
                      {t("customBadge")}
                    </span>
                  ) : null}
                  {exercise.is_compound ? (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-xs">{t("compound")}</span>
                  ) : null}
                </div>
              </div>
              <p className="mt-2 text-sm">{t(`muscles.${exercise.primary_muscle}`)}</p>
              <p className="text-xs text-muted-foreground">
                {exercise.equipment
                  .map((item) => t(`equipmentOptions.${item}`))
                  .join(", ")}{" "}
                · {t(`levels.${exercise.difficulty}`)}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => openDetail(exercise.id)}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:border-foreground"
                >
                  {t("viewDetails")}
                </button>
                {activeWorkout ? (
                  <button
                    type="button"
                    onClick={() => addToWorkout(exercise)}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:border-primary"
                  >
                    {t("addToActive")}
                  </button>
                ) : null}
                {exercise.source === "custom" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => openEditModal(exercise)}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                    >
                      {t("editCustom")}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCustomExercise(exercise.id)}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-danger hover:text-danger"
                    >
                      {t("deleteCustom")}
                    </button>
                  </>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>

      {/* Exercise Detail Modal */}
      {(detailLoading || detail) ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl">
            {detailLoading || !detail ? (
              <p className="text-sm text-muted-foreground">{tCommon("loading")}</p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-semibold tracking-tight">
                        {locale === "en" ? detail.name_en : detail.name_id}
                      </h2>
                      {detail.source === "custom" ? (
                        <span className="rounded bg-primary/15 px-1.5 py-0.5 text-xs font-medium text-primary">
                          {t("customBadge")}
                        </span>
                      ) : null}
                      {detail.is_compound ? (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-xs">
                          {t("compound")}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t(`muscles.${detail.primary_muscle}`)}
                      {detail.secondary_muscles.length
                        ? ` (${detail.secondary_muscles
                            .map((m) => t(`muscles.${m}`))
                            .join(", ")})`
                        : ""}{" "}
                      · {detail.equipment.map((eq) => t(`equipmentOptions.${eq}`)).join(", ")} ·{" "}
                      {t(`levels.${detail.difficulty}`)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDetail(null)}
                    className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium"
                  >
                    {tCommon("close")}
                  </button>
                </div>

                {(locale === "en"
                  ? detail.description_en ?? detail.description_id
                  : detail.description_id ?? detail.description_en) ? (
                  <p className="text-sm text-muted-foreground">
                    {locale === "en"
                      ? detail.description_en ?? detail.description_id
                      : detail.description_id ?? detail.description_en}
                  </p>
                ) : null}

                <div className="space-y-2 rounded-xl border border-border bg-background p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("instructionsTitle")}
                  </h3>
                  {(() => {
                    const steps =
                      locale === "en" && detail.instructions_en.length
                        ? detail.instructions_en
                        : detail.instructions_id.length
                          ? detail.instructions_id
                          : detail.instructions_en;
                    if (!steps.length) {
                      return (
                        <p className="text-sm text-muted-foreground">{t("noInstructions")}</p>
                      );
                    }
                    return (
                      <ol className="list-decimal space-y-1.5 pl-4 text-sm">
                        {steps.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ol>
                    );
                  })()}
                </div>

                <div className="space-y-2 rounded-xl border border-border bg-background p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("statsTitle")}
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-muted-foreground">{t("sessionCount")}</p>
                      <p className="font-semibold">{detail.stats.session_count}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t("lastPerformed")}</p>
                      <p className="font-semibold">
                        {detail.stats.last_performed_at
                          ? new Date(detail.stats.last_performed_at).toLocaleDateString()
                          : t("neverPerformed")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t("bestSet")}</p>
                      <p className="font-semibold">{detail.stats.best_set ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t("bestEst1rm")}</p>
                      <p className="font-semibold">
                        {detail.stats.best_est_1rm_kg !== null
                          ? `${fmt(fromKg(detail.stats.best_est_1rm_kg, unitSystem))} ${unit}`
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t("volume30d")}</p>
                      <p className="font-semibold">
                        {fmt(fromKg(detail.stats.volume_30d_kg, unitSystem))} {unit}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Create / Edit Custom Exercise Modal */}
      {formOpen ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold tracking-tight">
                {editingId ? t("editCustom") : t("createCustom")}
              </h2>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium"
              >
                {tCommon("close")}
              </button>
            </div>

            <form onSubmit={submitCustomExercise} className="mt-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium">{t("nameId")}</label>
                  <input
                    type="text"
                    required
                    maxLength={120}
                    value={nameId}
                    onChange={(e) => setNameId(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">{t("nameEn")}</label>
                  <input
                    type="text"
                    maxLength={120}
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium">{t("primaryMuscle")}</label>
                  <select
                    value={primaryMuscle}
                    onChange={(e) => setPrimaryMuscle(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    {MUSCLES.map((m) => (
                      <option key={m} value={m}>
                        {t(`muscles.${m}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">{t("difficultyLabel")}</label>
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    {DIFFICULTY.map((d) => (
                      <option key={d} value={d}>
                        {t(`levels.${d}`)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-medium">{t("secondaryMuscles")}</p>
                <div className="flex flex-wrap gap-1.5">
                  {MUSCLES.filter((m) => m !== primaryMuscle).map((m) => {
                    const active = secondaryMuscles.includes(m);
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => toggleArrayItem(secondaryMuscles, m, setSecondaryMuscles)}
                        className={
                          active
                            ? "rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground"
                            : "rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                        }
                      >
                        {t(`muscles.${m}`)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-medium">{t("equipmentFilter")}</p>
                <div className="flex flex-wrap gap-1.5">
                  {EQUIPMENT_LIST.map((eq) => {
                    const active = selectedEquipment.includes(eq);
                    return (
                      <button
                        key={eq}
                        type="button"
                        onClick={() =>
                          toggleArrayItem(selectedEquipment, eq, setSelectedEquipment)
                        }
                        className={
                          active
                            ? "rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground"
                            : "rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                        }
                      >
                        {t(`equipmentOptions.${eq}`)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">{t("descriptionLabel")}</label>
                <input
                  type="text"
                  maxLength={500}
                  value={descriptionId}
                  onChange={(e) => setDescriptionId(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">{t("instructionsLabel")}</label>
                <textarea
                  rows={4}
                  value={instructionsText}
                  onChange={(e) => setInstructionsText(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>

              {formError ? (
                <p role="alert" className="text-sm text-danger">
                  {formError}
                </p>
              ) : null}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="rounded-lg border border-border px-4 py-2 text-sm"
                >
                  {tCommon("close")}
                </button>
                <button
                  type="submit"
                  disabled={formSaving}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
                >
                  {formSaving ? tCommon("saving") : tCommon("save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
