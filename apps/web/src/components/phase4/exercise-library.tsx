"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

type Exercise = {
  id: string;
  name_id: string;
  name_en: string;
  primary_muscle: string;
  secondary_muscles: string[];
  equipment: string[];
  difficulty: string;
  is_compound: boolean;
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

const DIFFICULTY = ["beginner", "intermediate", "advanced"];

export function ExerciseLibrary() {
  const t = useTranslations("exercises");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const locale = useLocale();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [rows, setRows] = useState<Exercise[]>([]);
  const [activeWorkout, setActiveWorkout] = useState<{ id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/workouts/active")
      .then((response) => response.json())
      .then((payload) => setActiveWorkout(payload.data?.[0] ?? null))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams({ include_custom: "true", limit: "50" });
      if (query.trim()) params.set("q", query.trim());
      if (muscle) params.set("muscle", muscle);
      if (difficulty) params.set("difficulty", difficulty);
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
          if (active) setError(tErrors("NETWORK_ERROR"));
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, query ? 250 : 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, muscle, difficulty, availableOnly, tErrors]);

  async function addToWorkout(exercise: Exercise) {
    if (!activeWorkout) return;
    const response = await fetch(`/api/v1/workouts/${activeWorkout.id}/exercises`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ exercise_id: exercise.id })
    });
    if (response.ok) router.push(`/${locale}/workouts/${activeWorkout.id}`);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("libraryTitle")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("libraryDescription")}</p>
      </div>

      <div className="space-y-2 rounded-xl border border-border bg-card p-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("searchPlaceholder")}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <div className="flex flex-wrap gap-2">
          <select
            value={muscle}
            onChange={(event) => setMuscle(event.target.value)}
            className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
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
            className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
          >
            <option value="">{t("allLevels")}</option>
            {DIFFICULTY.map((item) => (
              <option key={item} value={item}>
                {t(`levels.${item}`)}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 rounded-lg border border-border px-2 py-1.5 text-sm">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(event) => setAvailableOnly(event.target.checked)}
            />
            {t("availableOnly")}
          </label>
        </div>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {loading ? <p className="text-sm text-muted-foreground">{tCommon("loading")}</p> : null}

      {!loading && rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {t("empty")}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {rows.map((exercise) => (
          <article key={exercise.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="font-medium">{exercise.name_id}</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {exercise.name_en !== exercise.name_id ? exercise.name_en : null}
                </p>
              </div>
              {exercise.is_compound ? (
                <span className="rounded bg-muted px-1.5 py-0.5 text-xs">{t("compound")}</span>
              ) : null}
            </div>
            <p className="mt-2 text-sm">{t(`muscles.${exercise.primary_muscle}`)}</p>
            <p className="text-xs text-muted-foreground">
              {exercise.equipment
                .map((item) => t(`equipmentOptions.${item}`))
                .join(", ")}{" "}
              · {t(`levels.${exercise.difficulty}`)}
            </p>
            {activeWorkout ? (
              <button
                type="button"
                onClick={() => addToWorkout(exercise)}
                className="mt-3 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:border-primary"
              >
                {t("addToActive")}
              </button>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
