"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

const GOALS = [
  "lose_weight",
  "gain_muscle",
  "strength",
  "endurance",
  "general_fitness",
  "body_recomposition"
] as const;

const LEVELS = ["beginner", "intermediate", "advanced"] as const;

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
] as const;

const SPLITS = ["full_body", "upper_lower", "push_pull_legs", "bro_split", "custom"] as const;
const INJURIES = [
  "knee",
  "shoulder",
  "lower_back",
  "elbow",
  "wrist",
  "hip",
  "ankle",
  "neck",
  "hamstring",
  "groin"
] as const;

type Form = {
  goals: string[];
  experience_level: string;
  days_per_week: number;
  session_minutes: number;
  equipment: string[];
  preferred_split: string;
  injury_areas: string[];
  height_cm: string;
  sex: string;
};

const INITIAL: Form = {
  goals: [],
  experience_level: "beginner",
  days_per_week: 3,
  session_minutes: 60,
  equipment: ["bodyweight"],
  preferred_split: "full_body",
  injury_areas: [],
  height_cm: "",
  sex: ""
};

function ClassNames(...items: Array<string | false | null | undefined>) {
  return items.filter(Boolean).join(" ");
}

export function OnboardingWizard() {
  const t = useTranslations("onboarding");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const locale = useLocale();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(INITIAL);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/v1/profile")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (!active || !payload?.data) return;
        const profile = payload.data;
        setForm({
          goals: profile.goals ?? [],
          experience_level: profile.experience_level ?? "beginner",
          days_per_week: profile.days_per_week ?? 3,
          session_minutes: profile.session_minutes ?? 60,
          equipment: profile.equipment?.length ? profile.equipment : ["bodyweight"],
          preferred_split: profile.preferred_split ?? "full_body",
          injury_areas: profile.injury_areas ?? [],
          height_cm: profile.height_cm ? String(profile.height_cm) : "",
          sex: profile.sex ?? ""
        });
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  function toggle(field: "goals" | "equipment" | "injury_areas", value: string) {
    setForm((current) => {
      const values = current[field];
      const nextValues = values.includes(value)
        ? values.filter((item) => item !== value)
        : field === "goals"
          ? [...values.slice(-1), value]
          : [...values, value];
      return { ...current, [field]: nextValues };
    });
  }

  async function finish(skip = false) {
    setPending(true);
    setError(null);
    try {
      if (!skip) {
        const response = await fetch("/api/v1/profile", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            goals: form.goals,
            experience_level: form.experience_level,
            days_per_week: form.days_per_week,
            session_minutes: form.session_minutes,
            equipment: form.equipment,
            preferred_split: form.preferred_split,
            injury_areas: form.injury_areas,
            ...(form.height_cm ? { height_cm: Number(form.height_cm) } : {}),
            ...(form.sex ? { sex: form.sex } : {})
          })
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          const code = payload?.error?.code ?? "INTERNAL_ERROR";
          setError(tErrors.has(code) ? tErrors(code) : tErrors("INTERNAL_ERROR"));
          return;
        }
      }

      const done = await fetch("/api/v1/profile/onboarding", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ step: "done" })
      });
      if (!done.ok) {
        setError(tErrors("INTERNAL_ERROR"));
        return;
      }
      router.replace(`/${locale}/dashboard`);
      router.refresh();
    } catch {
      setError(tErrors("NETWORK_ERROR"));
    } finally {
      setPending(false);
    }
  }

  const steps = [
    {
      title: t("goalsTitle"),
      description: t("goalsDescription"),
      body: (
        <div className="grid gap-2 sm:grid-cols-2">
          {GOALS.map((goal) => (
            <button
              key={goal}
              type="button"
              onClick={() => toggle("goals", goal)}
              className={ClassNames(
                "rounded-xl border px-4 py-3 text-left text-sm transition",
                form.goals.includes(goal)
                  ? "border-primary bg-primary/10 font-medium"
                  : "border-border bg-card hover:border-primary/50"
              )}
            >
              {t(`goals.${goal}`)}
            </button>
          ))}
        </div>
      )
    },
    {
      title: t("levelTitle"),
      description: t("levelDescription"),
      body: (
        <div className="grid gap-2">
          {LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setForm((value) => ({ ...value, experience_level: level }))}
              className={ClassNames(
                "rounded-xl border px-4 py-3 text-left text-sm transition",
                form.experience_level === level
                  ? "border-primary bg-primary/10 font-medium"
                  : "border-border bg-card hover:border-primary/50"
              )}
            >
              <span className="block font-medium">{t(`levels.${level}.title`)}</span>
              <span className="mt-1 block text-muted-foreground">
                {t(`levels.${level}.description`)}
              </span>
            </button>
          ))}
        </div>
      )
    },
    {
      title: t("scheduleTitle"),
      description: t("scheduleDescription"),
      body: (
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-sm font-medium">{t("daysPerWeek")}</p>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6, 7].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setForm((value) => ({ ...value, days_per_week: days }))}
                  className={ClassNames(
                    "size-10 rounded-lg border text-sm transition",
                    form.days_per_week === days
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:border-primary/50"
                  )}
                >
                  {days}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">{t("sessionMinutes")}</p>
            <div className="flex flex-wrap gap-2">
              {[30, 45, 60, 75, 90].map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  onClick={() =>
                    setForm((value) => ({ ...value, session_minutes: minutes }))
                  }
                  className={ClassNames(
                    "rounded-lg border px-3 py-2 text-sm transition",
                    form.session_minutes === minutes
                      ? "border-primary bg-primary/10 font-medium"
                      : "border-border bg-card hover:border-primary/50"
                  )}
                >
                  {minutes} {t("minutes")}
                </button>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      title: t("equipmentTitle"),
      description: t("equipmentDescription"),
      body: (
        <div className="grid gap-2 sm:grid-cols-2">
          {EQUIPMENT.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => toggle("equipment", item)}
              className={ClassNames(
                "rounded-xl border px-4 py-3 text-left text-sm transition",
                form.equipment.includes(item)
                  ? "border-primary bg-primary/10 font-medium"
                  : "border-border bg-card hover:border-primary/50"
              )}
            >
              {t(`equipmentOptions.${item}`)}
            </button>
          ))}
        </div>
      )
    },
    {
      title: t("preferencesTitle"),
      description: t("preferencesDescription"),
      body: (
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-sm font-medium">{t("split")}</p>
            <div className="flex flex-wrap gap-2">
              {SPLITS.map((split) => (
                <button
                  key={split}
                  type="button"
                  onClick={() => setForm((value) => ({ ...value, preferred_split: split }))}
                  className={ClassNames(
                    "rounded-lg border px-3 py-2 text-sm transition",
                    form.preferred_split === split
                      ? "border-primary bg-primary/10 font-medium"
                      : "border-border bg-card hover:border-primary/50"
                  )}
                >
                  {t(`splits.${split}`)}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium">
              {t("height")}
              <input
                type="number"
                min={80}
                max={250}
                step="0.1"
                value={form.height_cm}
                onChange={(event) =>
                  setForm((value) => ({ ...value, height_cm: event.target.value }))
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2 font-normal outline-none focus:border-primary"
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium">
              {t("sex")}
              <select
                value={form.sex}
                onChange={(event) => setForm((value) => ({ ...value, sex: event.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 font-normal outline-none focus:border-primary"
              >
                <option value="">{t("preferNotToSay")}</option>
                <option value="male">{t("sexOptions.male")}</option>
                <option value="female">{t("sexOptions.female")}</option>
                <option value="other">{t("sexOptions.other")}</option>
              </select>
            </label>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">{t("injuries")}</p>
            <div className="flex flex-wrap gap-2">
              {INJURIES.map((injury) => (
                <button
                  key={injury}
                  type="button"
                  onClick={() => toggle("injury_areas", injury)}
                  className={ClassNames(
                    "rounded-lg border px-3 py-1.5 text-sm transition",
                    form.injury_areas.includes(injury)
                      ? "border-primary bg-primary/10 font-medium"
                      : "border-border bg-card hover:border-primary/50"
                  )}
                >
                  {t(`injuryOptions.${injury}`)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )
    }
  ];

  const current = steps[step]!;

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex gap-1.5" aria-hidden="true">
          {steps.map((_, index) => (
            <span
              key={index}
              className={ClassNames(
                "h-1.5 w-10 rounded-full",
                index <= step ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => finish(true)}
          disabled={pending}
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline disabled:opacity-60"
        >
          {t("skip")}
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 sm:p-8">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t("stepOf", { current: step + 1, total: steps.length })}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{current.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{current.description}</p>
        <div className="mt-6">{current.body}</div>

        {error ? (
          <p role="alert" className="mt-4 text-sm text-danger">
            {error}
          </p>
        ) : null}

        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setStep((value) => Math.max(0, value - 1))}
            disabled={step === 0 || pending}
            className="rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-40"
          >
            {t("back")}
          </button>
          {step < steps.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((value) => Math.min(steps.length - 1, value + 1))}
              disabled={pending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              {t("next")}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => finish(false)}
              disabled={pending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              {pending ? tCommon("saving") : t("finish")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
