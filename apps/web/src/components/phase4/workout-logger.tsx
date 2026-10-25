"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { fromKg, toKg, weightUnitLabel, type UnitSystem } from "@gymapps/domain";
import { ExercisePicker, type PickedExercise } from "@/components/phase4/exercise-picker";

type WorkoutSet = {
  id: string;
  set_number: number;
  weight_kg: number;
  reps: number;
  rpe: number | null;
  is_warmup: boolean;
  is_completed: boolean;
  is_pr: boolean;
  delta_vs_last: { weight_kg: number; reps: number } | null;
};

type PreviousPerformance = {
  date: string;
  sets: Array<{ set_number: number; weight_kg: number; reps: number }>;
};

type WorkoutExercise = {
  id: string;
  exercise_id: string;
  exercise_name: string;
  previous_performance: PreviousPerformance | null;
  sets: WorkoutSet[];
};

type Workout = {
  id: string;
  title: string;
  status: "active" | "finished" | "abandoned";
  started_at: string;
  duration_seconds: number | null;
  total_volume_kg: number;
  total_sets: number;
  total_reps: number;
  pr_count: number;
  exercises: WorkoutExercise[];
};

function fmt(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function deltaLabel(delta: WorkoutSet["delta_vs_last"], unitSystem: UnitSystem) {
  if (!delta) return null;
  const unit = weightUnitLabel(unitSystem);
  const parts = [];
  if (delta.weight_kg) {
    const converted = fromKg(Math.abs(delta.weight_kg), unitSystem);
    parts.push(`${delta.weight_kg > 0 ? "+" : "-"}${fmt(converted)} ${unit}`);
  }
  if (delta.reps) parts.push(`${delta.reps > 0 ? "+" : ""}${delta.reps} rep`);
  return parts.length ? parts.join(" · ") : null;
}

function ExerciseCard({
  item,
  active,
  pending,
  unitSystem,
  onLog,
  onToggle,
  onToggleWarmup,
  onDeleteSet,
  onRemoveExercise
}: {
  item: WorkoutExercise;
  active: boolean;
  pending: boolean;
  unitSystem: UnitSystem;
  onLog: (input: {
    weightKg: number;
    reps: number;
    rpe?: number;
    isWarmup: boolean;
  }) => Promise<boolean>;
  onToggle: (set: WorkoutSet) => void;
  onToggleWarmup: (set: WorkoutSet) => void;
  onDeleteSet: (set: WorkoutSet) => void;
  onRemoveExercise: () => void;
}) {
  const t = useTranslations("workout");
  const unit = weightUnitLabel(unitSystem);
  const last = item.sets.at(-1);
  const previous = item.previous_performance?.sets.at(-1);
  const initialWeight = fromKg(last?.weight_kg ?? previous?.weight_kg ?? 0, unitSystem);
  const [weight, setWeight] = useState(String(initialWeight));
  const [reps, setReps] = useState(String(last?.reps ?? previous?.reps ?? 8));
  const [rpe, setRpe] = useState(last?.rpe ? String(last.rpe) : "");
  const [isWarmup, setIsWarmup] = useState(false);

  useEffect(() => {
    if (!last) return;
    setWeight(String(fromKg(last.weight_kg, unitSystem)));
    setReps(String(last.reps));
    setRpe(last.rpe ? String(last.rpe) : "");
  }, [last, unitSystem]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const numericWeight = Number(weight);
    const weightKg = toKg(numericWeight, unitSystem);
    const parsedRpe = rpe.trim() ? Number(rpe) : undefined;
    const ok = await onLog({
      weightKg,
      reps: Number(reps),
      ...(parsedRpe !== undefined && !Number.isNaN(parsedRpe) ? { rpe: parsedRpe } : {}),
      isWarmup
    });
    if (ok) {
      setWeight(String(numericWeight));
      setReps(String(Number(reps)));
      setIsWarmup(false);
    }
  }

  return (
    <section className="card animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-body font-medium text-text-primary">{item.exercise_name}</h3>
          <p className="mt-0.5 text-caption text-text-secondary">
            {item.sets.length} {t("sets")}
            {item.previous_performance
              ? ` · ${t("lastPerformed", {
                  date: new Date(item.previous_performance.date).toLocaleDateString()
                })}`
              : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {item.previous_performance ? (
            <span className="chip chip-status chip-status-flat text-caption">
              {t("previous")}: {fmt(fromKg(item.previous_performance.sets.at(-1)?.weight_kg ?? 0, unitSystem))} {unit} × {item.previous_performance.sets.at(-1)?.reps ?? 0}
            </span>
          ) : null}
          {active ? (
            <button
              type="button"
              onClick={onRemoveExercise}
              disabled={pending}
              title={t("removeExercise")}
              className="btn btn-ghost btn-sm text-caption text-error hover:text-error"
            >
              {t("removeExercise")}
            </button>
          ) : null}
        </div>
      </div>

      {item.sets.length ? (
        <ul className="mt-3 list divide-y divide-border">
          {item.sets.map((set) => {
            const delta = deltaLabel(set.delta_vs_last, unitSystem);
            return (
              <li key={set.id} className="list-item flex-wrap gap-2 px-3 py-2">
                <button
                  type="button"
                  onClick={() => active && onToggle(set)}
                  disabled={!active || pending}
                  aria-label={set.is_completed ? t("markIncomplete") : t("markComplete")}
                  className={set.is_completed
                    ? "flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground"
                    : "flex size-6 items-center justify-center rounded-full border border-border text-text-tertiary"}
                >
                  ✓
                </button>
                <span className="w-8 text-caption text-text-tertiary">#{set.set_number}</span>
                {active ? (
                  <button
                    type="button"
                    onClick={() => onToggleWarmup(set)}
                    disabled={pending}
                    title={t("toggleWarmup")}
                    className={set.is_warmup
                      ? "chip chip-status chip-status-warning text-[10px]"
                      : "btn btn-ghost btn-sm text-[10px] px-2 py-0.5"}
                  >
                    {t("warmupShort")}
                  </button>
                ) : set.is_warmup ? (
                  <span className="chip chip-status chip-status-warning text-[10px]">
                    {t("warmupShort")}
                  </span>
                ) : null}
                <span className={set.is_completed ? "font-medium text-text-primary" : "text-text-secondary"}>
                  {fmt(fromKg(set.weight_kg, unitSystem))} {unit} × {set.reps}
                </span>
                {set.rpe !== null && set.rpe !== undefined ? (
                  <span className="chip chip-status chip-status-flat text-[10px]">
                    {t("rpe")} {fmt(set.rpe)}
                  </span>
                ) : null}
                {set.is_pr ? (
                  <span className="chip chip-filter text-[10px] bg-primary-light/80">
                    PR
                  </span>
                ) : null}
                {delta ? (
                  <span className="ml-auto text-caption text-text-tertiary">{delta}</span>
                ) : null}
                {active ? (
                  <button
                    type="button"
                    onClick={() => onDeleteSet(set)}
                    disabled={pending}
                    aria-label={t("removeSet")}
                    title={t("removeSet")}
                    className={`${delta ? "" : "ml-auto"} btn btn-ghost btn-sm text-[10px] px-1.5 py-0.5 text-error hover:bg-error-light`}
                  >
                    ×
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}

      {active ? (
        <form onSubmit={submit} className="mt-3 flex flex-wrap items-end gap-2">
          <label className="input-label text-caption">
            {unitSystem === "imperial" ? t("weightLb") : t("weight")}
            <input
              type="number"
              min={0}
              step="0.5"
              value={weight}
              onChange={(event) => setWeight(event.target.value)}
              className="input w-24"
            />
          </label>
          <label className="input-label text-caption">
            {t("reps")}
            <input
              type="number"
              min={0}
              step="1"
              value={reps}
              onChange={(event) => setReps(event.target.value)}
              className="input w-20"
            />
          </label>
          <label className="input-label text-caption">
            {t("rpeOptional")}
            <input
              type="number"
              min={5}
              max={10}
              step="0.5"
              placeholder="6–10"
              value={rpe}
              onChange={(event) => setRpe(event.target.value)}
              className="input w-20"
            />
          </label>
          <label className="flex items-center gap-1.5 btn btn-ghost btn-sm px-2.5 py-2 text-caption">
            <input
              type="checkbox"
              checked={isWarmup}
              onChange={(event) => setIsWarmup(event.target.checked)}
              className="checkbox"
            />
            <span>{t("warmup")}</span>
          </label>
          <button
            type="submit"
            disabled={pending}
            className="btn btn-primary btn-md"
          >
            {pending ? "…" : t("logSet")}
          </button>
        </form>
      ) : null}
    </section>
  );
}

export function WorkoutLogger({
  workoutId,
  unitSystem = "metric"
}: {
  workoutId: string;
  unitSystem?: UnitSystem;
}) {
  const t = useTranslations("workout");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const locale = useLocale();
  const router = useRouter();
  const unit = weightUnitLabel(unitSystem);

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rest, setRest] = useState(0);

  const load = useCallback(
    async (showLoading = false) => {
      if (showLoading) setLoading(true);
      try {
        const response = await fetch(`/api/v1/workouts/${workoutId}`);
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          const code = payload?.error?.code ?? "INTERNAL_ERROR";
          setError(tErrors.has(code) ? tErrors(code) : tErrors("INTERNAL_ERROR"));
          return;
        }
        setWorkout(payload.data);
      } catch {
        setError(tErrors("NETWORK_ERROR"));
      } finally {
        setLoading(false);
      }
    },
    [workoutId, tErrors]
  );

  useEffect(() => {
    load(true);
  }, [load]);

  useEffect(() => {
    if (rest <= 0) return;
    const timer = setInterval(() => setRest((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [rest]);

  async function addExercise(exercise: PickedExercise) {
    setPendingId("add");
    setError(null);
    try {
      const response = await fetch(`/api/v1/workouts/${workoutId}/exercises`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ exercise_id: exercise.id })
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const code = payload?.error?.code ?? "INTERNAL_ERROR";
        setError(tErrors.has(code) ? tErrors(code) : tErrors("INTERNAL_ERROR"));
        return;
      }
      await load();
    } catch {
      setError(tErrors("NETWORK_ERROR"));
    } finally {
      setPendingId(null);
    }
  }

  async function removeExercise(item: WorkoutExercise) {
    setPendingId(item.id);
    setError(null);
    try {
      const response = await fetch(
        `/api/v1/workouts/${workoutId}/exercises/${item.id}`,
        { method: "DELETE" }
      );
      if (!response.ok && response.status !== 204) {
        const payload = await response.json().catch(() => null);
        const code = payload?.error?.code ?? "INTERNAL_ERROR";
        setError(tErrors.has(code) ? tErrors(code) : tErrors("INTERNAL_ERROR"));
        return;
      }
      await load();
    } catch {
      setError(tErrors("NETWORK_ERROR"));
    } finally {
      setPendingId(null);
    }
  }

  async function logSet(
    item: WorkoutExercise,
    input: { weightKg: number; reps: number; rpe?: number; isWarmup: boolean }
  ) {
    setPendingId(item.id);
    setError(null);
    try {
      const response = await fetch(
        `/api/v1/workouts/${workoutId}/exercises/${item.id}/sets`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            weight_kg: input.weightKg,
            reps: input.reps,
            is_warmup: input.isWarmup,
            is_completed: true,
            ...(input.rpe !== undefined ? { rpe: input.rpe } : {})
          })
        }
      );
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const code = payload?.error?.code ?? "INTERNAL_ERROR";
        setError(tErrors.has(code) ? tErrors(code) : tErrors("INTERNAL_ERROR"));
        return false;
      }
      setRest(90);
      await load();
      return true;
    } catch {
      setError(tErrors("NETWORK_ERROR"));
      return false;
    } finally {
      setPendingId(null);
    }
  }

  async function toggleSet(item: WorkoutExercise, set: WorkoutSet) {
    setPendingId(set.id);
    try {
      await fetch(`/api/v1/workouts/${workoutId}/exercises/${item.id}/sets/${set.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ is_completed: !set.is_completed })
      });
      await load();
    } finally {
      setPendingId(null);
    }
  }

  async function toggleWarmup(item: WorkoutExercise, set: WorkoutSet) {
    setPendingId(set.id);
    try {
      await fetch(`/api/v1/workouts/${workoutId}/exercises/${item.id}/sets/${set.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ is_warmup: !set.is_warmup })
      });
      await load();
    } finally {
      setPendingId(null);
    }
  }

  async function deleteSet(item: WorkoutExercise, set: WorkoutSet) {
    setPendingId(set.id);
    try {
      await fetch(`/api/v1/workouts/${workoutId}/exercises/${item.id}/sets/${set.id}`, {
        method: "DELETE"
      });
      await load();
    } finally {
      setPendingId(null);
    }
  }

  async function finish() {
    setFinishing(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/workouts/${workoutId}/finish`, { method: "POST" });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const code = payload?.error?.code ?? "INTERNAL_ERROR";
        setError(tErrors.has(code) ? tErrors(code) : tErrors("INTERNAL_ERROR"));
        return;
      }
      setRest(0);
      await load();
    } catch {
      setError(tErrors("NETWORK_ERROR"));
    } finally {
      setFinishing(false);
    }
  }

  if (loading) {
    return <p className="text-body text-text-tertiary animate-fade-in">{tCommon("loading")}</p>;
  }

  if (!workout) {
    return (
      <div className="space-y-3 animate-fade-in">
        <p className="text-body text-error">{error ?? tErrors("INTERNAL_ERROR")}</p>
        <button
          type="button"
          onClick={() => load(true)}
          className="btn btn-secondary btn-sm"
        >
          {tCommon("retry")}
        </button>
      </div>
    );
  }

  if (workout.status !== "active") {
    const minutes = Math.max(1, Math.round((workout.duration_seconds ?? 0) / 60));
    return (
      <div className="space-y-4 animate-fade-in">
        <div>
          <p className="text-overline text-text-secondary">{t("finished")}</p>
          <h1 className="mt-1 text-headline">{workout.title}</h1>
          <p className="mt-1 text-body-small text-text-secondary">
            {new Date(workout.started_at).toLocaleString()} · {minutes} {t("minutes")}
          </p>
        </div>
        <div className="dashboard-grid">
          {[
            [t("volume"), `${fmt(fromKg(workout.total_volume_kg, unitSystem))} ${unit}`],
            [t("workingSets"), String(workout.total_sets)],
            [t("reps"), String(workout.total_reps)],
            [t("prs"), String(workout.pr_count)]
          ].map(([label, value]) => (
            <div key={label} className="metric-widget">
              <p className="text-overline text-text-secondary">{label}</p>
              <p className="metric-value text-[22px] mt-1">{value}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => router.push(`/${locale}/dashboard`)}
            className="btn btn-primary btn-md"
          >
            {t("backToDashboard")}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/${locale}/workouts`)}
            className="btn btn-secondary btn-md"
          >
            {t("allWorkouts")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-16 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-overline text-text-secondary">{t("activeSession")}</p>
          <h1 className="mt-1 text-headline">{workout.title}</h1>
          <p className="mt-1 text-body-small text-text-secondary">
            {fmt(fromKg(workout.total_volume_kg, unitSystem))} {unit} · {workout.total_sets}{" "}
            {t("sets")}
          </p>
        </div>
        <button
          type="button"
          onClick={finish}
          disabled={finishing}
          className="btn btn-primary btn-md"
        >
          {finishing ? "…" : t("finish")}
        </button>
      </div>

      {error ? (
        <p role="alert" className="input-helper input-helper-error animate-fade-in">
          {error}
        </p>
      ) : null}

      {rest > 0 ? (
        <div className="card border-primary/30 bg-primary-light/50 sticky top-14 z-10 animate-slide-up">
          <div className="flex items-center justify-between">
            <span className="text-body-small text-text-primary">
              {t("restTimer")} · {Math.floor(rest / 60)}:{String(rest % 60).padStart(2, "0")}
            </span>
            <button
              type="button"
              onClick={() => setRest(0)}
              className="btn btn-secondary btn-sm text-caption"
            >
              {t("skipRest")}
            </button>
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        {workout.exercises.map((item) => (
          <ExerciseCard
            key={item.id}
            item={item}
            active
            unitSystem={unitSystem}
            pending={pendingId === item.id || pendingId === "add"}
            onLog={(input) => logSet(item, input)}
            onToggle={(set) => toggleSet(item, set)}
            onToggleWarmup={(set) => toggleWarmup(item, set)}
            onDeleteSet={(set) => deleteSet(item, set)}
            onRemoveExercise={() => removeExercise(item)}
          />
        ))}
      </div>

      <div className="card border-dashed border-border">
        <div className="flex items-center justify-between">
          <p className="text-body-small text-text-secondary">{t("addExerciseHint")}</p>
          <ExercisePicker onSelect={addExercise} />
        </div>
      </div>
    </div>
  );
}