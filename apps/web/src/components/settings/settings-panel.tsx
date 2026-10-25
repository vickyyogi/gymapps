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
    return <p className="text-body text-text-tertiary animate-fade-in">{tCommon("loading")}</p>;
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-headline">{t("title")}</h1>
          <p className="mt-1 text-body-small text-text-secondary">{t("description")}</p>
        </div>
        <Link
          href="/onboarding?edit=1"
          className="btn btn-secondary btn-sm"
        >
          {t("editTrainingProfile")}
        </Link>
      </div>

      {error ? (
        <div role="alert" className="card border-error/40 bg-error-light text-error animate-slide-up">
          <p className="text-body-small">{error}</p>
        </div>
      ) : null}

      <section className="card">
        <h2 className="text-subhead">{t("profileSection")}</h2>
        <form onSubmit={savePreferences} className="mt-4 space-y-4">
          <div className="dashboard-grid">
            <label className="block space-y-1">
              <span className="text-caption font-medium text-text-secondary">{tCommon("email")}</span>
              <input
                type="email"
                value={email}
                disabled
                className="input bg-background text-text-tertiary cursor-not-allowed"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-caption font-medium text-text-secondary">{tCommon("displayName")}</span>
              <input
                type="text"
                maxLength={80}
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="input"
                placeholder={tCommon("displayNamePlaceholder")}
              />
            </label>

            <label className="block space-y-1">
              <span className="text-caption font-medium text-text-secondary">{tLocale("label")}</span>
              <select
                value={locale}
                onChange={(event) => setLocale(event.target.value === "en" ? "en" : "id")}
                className="input"
              >
                <option value="id">{tLocale("id")}</option>
                <option value="en">{tLocale("en")}</option>
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-caption font-medium text-text-secondary">{t("unitSystem")}</span>
              <select
                value={unitSystem}
                onChange={(event) =>
                  setUnitSystem(event.target.value === "imperial" ? "imperial" : "metric")
                }
                className="input"
              >
                <option value="metric">{t("units.metric")}</option>
                <option value="imperial">{t("units.imperial")}</option>
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-caption font-medium text-text-secondary">{t("timezone")}</span>
              <select
                value={timezone}
                onChange={(event) => setTimezone(event.target.value)}
                className="input"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-caption font-medium text-text-secondary">{tTheme("label")}</span>
              <select
                value={theme}
                onChange={(event) =>
                  setTheme(event.target.value as "light" | "dark" | "system")
                }
                className="input"
              >
                <option value="system">{tTheme("system")}</option>
                <option value="light">{tTheme("light")}</option>
                <option value="dark">{tTheme("dark")}</option>
              </select>
            </label>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={emailOptIn}
              onChange={(event) => setEmailOptIn(event.target.checked)}
              className="checkbox"
            />
            <span className="text-body text-text-primary">{t("emailOptIn")}</span>
          </label>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={savingProfile}
              className="btn btn-primary btn-md"
            >
              {savingProfile ? tCommon("saving") : tCommon("save")}
            </button>
            {profileSaved ? (
              <span className="text-body-small text-text-secondary">{t("saved")}</span>
            ) : null}
          </div>
        </form>
      </section>

      <section className="card">
        <h2 className="text-subhead">{t("securitySection")}</h2>

        <form onSubmit={submitPasswordChange} className="mt-4 space-y-4">
          <h3 className="text-body font-medium text-text-primary">{t("changePasswordTitle")}</h3>
          <div className="dashboard-grid">
            <label className="block space-y-1">
              <span className="text-caption text-text-secondary">{t("currentPassword")}</span>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className="input"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-caption text-text-secondary">{t("newPassword")}</span>
              <input
                type="password"
                required
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="input"
              />
            </label>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={changingPassword}
              className="btn btn-secondary btn-md"
            >
              {changingPassword ? tCommon("saving") : t("changePasswordSubmit")}
            </button>
            {passwordSaved ? (
              <span className="text-body-small text-text-secondary">{t("passwordChanged")}</span>
            ) : null}
          </div>
        </form>

        <div className="border-t border-border pt-4 mt-4">
          <h3 className="text-body font-medium text-text-primary">{t("sessionsTitle")}</h3>
          <p className="mt-1 text-caption text-text-secondary">{t("sessionsDescription")}</p>
          <button
            type="button"
            onClick={logoutAllDevices}
            disabled={loggingOutAll}
            className="mt-3 btn btn-secondary btn-sm"
          >
            {t("logoutAll")}
          </button>
        </div>
      </section>

      <section className="card">
        <h2 className="text-subhead">{t("dataSection")}</h2>
        <p className="mt-1 text-body-small text-text-secondary">{t("exportDataDescription")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/exports" className="btn btn-secondary btn-sm">
            {t("openExports")}
          </Link>
          <Link href="/privacy" className="btn btn-ghost btn-sm">
            {t("privacyPolicy")}
          </Link>
          <Link href="/terms" className="btn btn-ghost btn-sm">
            {t("termsOfService")}
          </Link>
        </div>
      </section>

      <section className="card border-error/40 bg-error-light/50">
        <h2 className="text-subhead text-error">{t("dangerZone")}</h2>
        <p className="mt-1 text-body-small text-text-secondary">{t("deleteAccountWarning")}</p>

        {!deleteStep2 ? (
          <button
            type="button"
            onClick={() => setDeleteStep2(true)}
            className="mt-3 btn btn-ghost btn-sm text-error hover:bg-error-light hover:text-error"
          >
            {t("deleteStep1Button")}
          </button>
        ) : (
          <form onSubmit={confirmDeleteAccount} className="mt-4 space-y-4 card-elevated border border-error/30 p-4 animate-slide-up">
            <h3 className="text-body font-semibold text-text-primary">{t("deleteStep2Title")}</h3>
            <p className="text-caption text-text-secondary">{t("deleteStep2Instruction")}</p>

            <div className="dashboard-grid">
              <label className="block space-y-1">
                <span className="text-caption font-medium text-text-secondary">{t("confirmLabel")}</span>
                <input
                  type="text"
                  required
                  placeholder="DELETE"
                  value={deleteConfirmText}
                  onChange={(event) => setDeleteConfirmText(event.target.value)}
                  className="input focus:border-error"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-caption font-medium text-text-secondary">{tCommon("password")}</span>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={deletePassword}
                  onChange={(event) => setDeletePassword(event.target.value)}
                  className="input focus:border-error"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="submit"
                disabled={deletingAccount || deleteConfirmText !== "DELETE" || !deletePassword}
                className="btn btn-destructive btn-sm"
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
                className="btn btn-secondary btn-sm"
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