"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export type PickedExercise = {
  id: string;
  name_id: string;
  name_en: string;
  primary_muscle: string;
  equipment: string[];
  difficulty: string;
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
  "cardio"
];

const EQUIPMENT = [
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

export function ExercisePicker({
  onSelect,
  label
}: {
  onSelect: (exercise: PickedExercise) => void;
  label?: string;
}) {
  const t = useTranslations("exercises");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState("");
  const [equipment, setEquipment] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [rows, setRows] = useState<PickedExercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    const timer = setTimeout(() => {
      setLoading(true);
      setError(false);
      const params = new URLSearchParams({ include_custom: "true", limit: "30" });
      if (query.trim()) params.set("q", query.trim());
      if (muscle) params.set("muscle", muscle);
      if (equipment) params.set("equipment", equipment);
      if (availableOnly) params.set("available_only", "true");
      fetch(`/api/v1/exercises?${params}`)
        .then(async (response) => {
          if (!response.ok) throw new Error("failed");
          return response.json();
        })
        .then((payload) => {
          if (active) setRows(payload.data ?? []);
        })
        .catch(() => {
          if (active) setError(true);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, query ? 250 : 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [open, query, muscle, equipment, availableOnly]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn btn-secondary btn-sm"
      >
        {label ?? t("add")}
      </button>
      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4 animate-fade-in"
        >
          <div className="card-elevated w-full max-w-xl max-h-[90vh] flex flex-col rounded-xl animate-slide-up">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-subhead">{t("title")}</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn btn-ghost btn-sm"
              >
                {tCommon("close")}
              </button>
            </div>
            <div className="space-y-2 border-b border-border p-4">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("searchPlaceholder")}
                autoFocus
                className="input"
              />
              <div className="flex flex-wrap gap-2">
                <select
                  value={muscle}
                  onChange={(event) => setMuscle(event.target.value)}
                  aria-label={t("muscleFilter")}
                  className="input py-2"
                >
                  <option value="">{t("allMuscles")}</option>
                  {MUSCLES.map((item) => (
                    <option key={item} value={item}>
                      {t(`muscles.${item}`)}
                    </option>
                  ))}
                </select>
                <select
                  value={equipment}
                  onChange={(event) => setEquipment(event.target.value)}
                  aria-label={t("equipmentFilter")}
                  className="input py-2"
                >
                  <option value="">{t("allEquipment")}</option>
                  {EQUIPMENT.map((item) => (
                    <option key={item} value={item}>
                      {t(`equipmentOptions.${item}`)}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-2 text-body-small text-text-secondary">
                  <input
                    type="checkbox"
                    checked={availableOnly}
                    onChange={(event) => setAvailableOnly(event.target.checked)}
                    className="checkbox"
                  />
                  {t("availableOnly")}
                </label>
              </div>
            </div>
            <div className="min-h-32 flex-1 overflow-y-auto p-2">
              {loading ? (
                <p className="p-4 text-body text-text-tertiary">{tCommon("loading")}</p>
              ) : error ? (
                <p className="p-4 text-body text-error">{tCommon("retry")}</p>
              ) : rows.length === 0 ? (
                <p className="p-4 text-body text-text-tertiary">{t("empty")}</p>
              ) : (
                rows.map((exercise) => (
                  <button
                    key={exercise.id}
                    type="button"
                    onClick={() => {
                      onSelect(exercise);
                      setOpen(false);
                    }}
                    className="list-item w-full gap-3 hover:bg-muted/50"
                  >
                    <span className="flex-1 min-w-0">
                      <span className="block text-body font-medium text-text-primary truncate">{exercise.name_id}</span>
                      <span className="text-caption text-text-secondary">
                        {t(`muscles.${exercise.primary_muscle}`)} ·{" "}
                        {exercise.equipment
                          .map((item) => t(`equipmentOptions.${item}`))
                          .join(", ")}
                      </span>
                    </span>
                    <span className="text-caption text-text-tertiary">{t("pick")}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}