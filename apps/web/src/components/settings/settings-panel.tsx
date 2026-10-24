"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { THEME_STORAGE_KEY } from "@/lib/theme";

type ProfileData = {
  display_name: string | null;
  locale: "id" | "en";
  unit_system: "metric" | "imperial";
  timezone: string;
  theme: "light" | "dark" | "system";
  email_opt_in?: boolean;
};

const TIMEZONES = [
  "Asia/Jakarta",
  "Asia/Makassar",
  "Asia/Jayapura",
  "Asia/Singapore",
  "UTC"
];

export function SettingsPanel({ email }: { email: string }) {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const tTheme = useTranslations("theme");
  const tLocale = useTranslations("locale");
  const tErrors = useTranslations("errors");
  const currentLocale = useLocale();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [locale, setLocale] = useState<"id" | "en">(currentLocale === "en" ? "en" : "id");
  const [unitSystem, setUnitSystem] = useState<"metric" | "imperial">("metric");
  const [timezone, setTimezone] = useState("Asia/Jakarta");
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [emailOptIn, setEmailOptIn] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);

  const [loggingOutAll, setLoggingOutAll] = useState(false);

  const [deleteStep2, setDeleteStep2] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    fetch("/api/v1/profile")
      .then((res) => res.json())
      .then((payload: { data?: ProfileData }) => {
        if (!payload.data) return;
        setDisplayName(payload.data.display_name ?? "");
        setLocale(payload.data.locale === "en" ? "en" : "id");
        setUnitSystem(payload.data.unit_system === "imperial" ? "imperial" : "metric");
        setTimezone(payload.data.timezone || "Asia/Jakarta");
        setTheme(payload.data.theme ?? "system");
        setEmailOptIn(Boolean(payload.data.email_opt_in));
      })
      .catch(() => setError(tErrors("NETWORK_ERROR")))
      .finally(() => setLoading(false));
  }, [tErrors]);

  function applyTheme(next: "light" | "dark" | "system") {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
      const isDark =
        next === "dark" ||
        (next === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.classList.toggle("dark", isDark);
    } catch {
      // Ignore storage access errors
    }
  }

  async function savePreferences(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingProfile(true);
    setProfileSaved(false);
    setError(null);

    try {
      const response = await fetch("/api/v1/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...(displayName.trim() ? { display_name: displayName.trim() } : {}),
          locale,
          unit_system: unitSystem,
          timezone,
          theme,
          email_opt_in: emailOptIn
        })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const code = payload?.error?.code ?? "INTERNAL_ERROR";
        setError(tErrors.has(code) ? tErrors(code) : tErrors("INTERNAL_ERROR"));
        return;
      }

      applyTheme(theme);
      setProfileSaved(true);

      if (locale !== currentLocale) {
        router.replace(`/${locale}/settings`);
        router.refresh();
      } else {
        router.refresh();
      }
    } catch {
      setError(tErrors("NETWORK_ERROR"));
    } finally {
      setSavingProfile(false);
    }
  }

  async function submitPasswordChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setChangingPassword(true);
    setPasswordSaved(false);
    setError(null);

    try {
      const response = await fetch("/api/v1/auth/password/change", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const code = payload?.error?.code ?? "INTERNAL_ERROR";
        setError(tErrors.has(code) ? tErrors(code) : tErrors("INTERNAL_ERROR"));
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setPasswordSaved(true);
    } catch {
      setError(tErrors("NETWORK_ERROR"));
    } finally {
      setChangingPassword(false);
    }
  }

  async function logoutAllDevices() {
    setLoggingOutAll(true);
    setError(null);
    try {
      await fetch("/api/v1/auth/logout-all", { method: "POST" });
      router.replace(`/${currentLocale}/login`);
      router.refresh();
    } catch {
      setError(tErrors("NETWORK_ERROR"));
      setLoggingOutAll(false);
    }
  }

  async function confirmDeleteAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (deleteConfirmText !== "DELETE" || !deletePassword) return;
    setDeletingAccount(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/account", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          password: deletePassword,
          confirm: "DELETE"
        })
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const code = payload?.error?.code ?? "INTERNAL_ERROR";
        setError(tErrors.has(code) ? tErrors(code) : tErrors("INTERNAL_ERROR"));
        return;
      }
      router.replace(`/${currentLocale}/login`);
      router.refresh();
    } catch {
      setError(tErrors("NETWORK_ERROR"));
    } finally {
      setDeletingAccount(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">{tCommon("loading")}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <Link
          href="/onboarding?edit=1"
          className="rounded-lg border border-border px-3 py-2 text-sm hover:border-primary"
        >
          {t("editTrainingProfile")}
        </Link>
      </div>

      {error ? (
        <p role="alert" className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-base font-semibold">{t("profileSection")}</h2>
        <form onSubmit={savePreferences} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1 text-sm">
              <span className="font-medium">{tCommon("email")}</span>
              <input
                type="email"
                value={email}
                disabled
                className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground"
              />
            </label>

            <label className="block space-y-1 text-sm">
              <span className="font-medium">{tCommon("displayName")}</span>
              <input
                type="text"
                maxLength={80}
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </label>

            <label className="block space-y-1 text-sm">
              <span className="font-medium">{tLocale("label")}</span>
              <select
                value={locale}
                onChange={(event) => setLocale(event.target.value === "en" ? "en" : "id")}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="id">{tLocale("id")}</option>
                <option value="en">{tLocale("en")}</option>
              </select>
            </label>

            <label className="block space-y-1 text-sm">
              <span className="font-medium">{t("unitSystem")}</span>
              <select
                value={unitSystem}
                onChange={(event) =>
                  setUnitSystem(event.target.value === "imperial" ? "imperial" : "metric")
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="metric">{t("units.metric")}</option>
                <option value="imperial">{t("units.imperial")}</option>
              </select>
            </label>

            <label className="block space-y-1 text-sm">
              <span className="font-medium">{t("timezone")}</span>
              <select
                value={timezone}
                onChange={(event) => setTimezone(event.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1 text-sm">
              <span className="font-medium">{tTheme("label")}</span>
              <select
                value={theme}
                onChange={(event) =>
                  setTheme(event.target.value as "light" | "dark" | "system")
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="system">{tTheme("system")}</option>
                <option value="light">{tTheme("light")}</option>
                <option value="dark">{tTheme("dark")}</option>
              </select>
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={emailOptIn}
              onChange={(event) => setEmailOptIn(event.target.checked)}
            />
            <span>{t("emailOptIn")}</span>
          </label>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={savingProfile}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              {savingProfile ? tCommon("saving") : tCommon("save")}
            </button>
            {profileSaved ? (
              <span className="text-sm text-muted-foreground">{t("saved")}</span>
            ) : null}
          </div>
        </form>
      </section>

      <section className="space-y-5 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-base font-semibold">{t("securitySection")}</h2>

        <form onSubmit={submitPasswordChange} className="space-y-3">
          <h3 className="text-sm font-medium">{t("changePasswordTitle")}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1 text-sm">
              <span className="text-muted-foreground">{t("currentPassword")}</span>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-muted-foreground">{t("newPassword")}</span>
              <input
                type="password"
                required
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </label>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={changingPassword}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:border-primary disabled:opacity-60"
            >
              {changingPassword ? tCommon("saving") : t("changePasswordSubmit")}
            </button>
            {passwordSaved ? (
              <span className="text-sm text-muted-foreground">{t("passwordChanged")}</span>
            ) : null}
          </div>
        </form>

        <div className="border-t border-border pt-4">
          <h3 className="text-sm font-medium">{t("sessionsTitle")}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{t("sessionsDescription")}</p>
          <button
            type="button"
            onClick={logoutAllDevices}
            disabled={loggingOutAll}
            className="mt-3 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:border-primary disabled:opacity-60"
          >
            {t("logoutAll")}
          </button>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-base font-semibold">{t("dataSection")}</h2>
        <p className="text-sm text-muted-foreground">{t("exportDataDescription")}</p>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link
            href="/exports"
            className="rounded-lg border border-border px-3 py-2 font-medium hover:border-primary"
          >
            {t("openExports")}
          </Link>
          <Link
            href="/privacy"
            className="rounded-lg border border-border px-3 py-2 hover:border-primary"
          >
            {t("privacyPolicy")}
          </Link>
          <Link
            href="/terms"
            className="rounded-lg border border-border px-3 py-2 hover:border-primary"
          >
            {t("termsOfService")}
          </Link>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-danger/40 bg-danger/5 p-6">
        <h2 className="text-base font-semibold text-danger">{t("dangerZone")}</h2>
        <p className="text-sm text-muted-foreground">{t("deleteAccountWarning")}</p>

        {!deleteStep2 ? (
          <button
            type="button"
            onClick={() => setDeleteStep2(true)}
            className="rounded-lg border border-danger px-4 py-2 text-sm font-medium text-danger hover:bg-danger/10"
          >
            {t("deleteStep1Button")}
          </button>
        ) : (
          <form onSubmit={confirmDeleteAccount} className="space-y-3 rounded-xl border border-danger/40 bg-card p-4">
            <h3 className="text-sm font-semibold">{t("deleteStep2Title")}</h3>
            <p className="text-xs text-muted-foreground">{t("deleteStep2Instruction")}</p>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1 text-sm">
                <span className="font-medium">{t("confirmLabel")}</span>
                <input
                  type="text"
                  required
                  placeholder="DELETE"
                  value={deleteConfirmText}
                  onChange={(event) => setDeleteConfirmText(event.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-danger"
                />
              </label>

              <label className="block space-y-1 text-sm">
                <span className="font-medium">{tCommon("password")}</span>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={deletePassword}
                  onChange={(event) => setDeletePassword(event.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-danger"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={deletingAccount || deleteConfirmText !== "DELETE" || !deletePassword}
                className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {t("confirmDeleteButton")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDeleteStep2(false);
                  setDeleteConfirmText("");
                  setDeletePassword("");
                }}
                className="rounded-lg border border-border px-4 py-2 text-sm"
              >
                {t("cancelDelete")}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
