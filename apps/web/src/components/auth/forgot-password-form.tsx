"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function ForgotPasswordForm() {
  const t = useTranslations("auth.forgot");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");

  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/auth/password/forgot", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: new FormData(event.currentTarget).get("email") })
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: { code?: string };
        } | null;
        const code = payload?.error?.code ?? "INTERNAL_ERROR";
        setError(tErrors.has(code) ? tErrors(code) : tErrors("INTERNAL_ERROR"));
        return;
      }
      setSent(true);
    } catch {
      setError(tErrors("NETWORK_ERROR"));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="card w-full max-w-sm animate-fade-in">
      <h1 className="text-headline">{t("title")}</h1>
      {sent ? (
        <p className="mt-3 text-body-small text-text-secondary">{t("sent")}</p>
      ) : (
        <>
          <p className="mt-1 text-body-small text-text-secondary">{t("description")}</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="space-y-1">
              <label htmlFor="email" className="input-label">
                {tCommon("email")}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="input"
              />
            </div>

            {error ? (
              <p role="alert" className="input-helper input-helper-error animate-fade-in">
                {error}
              </p>
            ) : null}

            <button type="submit" disabled={pending} className="btn btn-primary btn-md w-full">
              {pending ? t("submitting") : t("submit")}
            </button>
          </form>
        </>
      )}
      <p className="mt-5 text-center text-body-small text-text-secondary">
        <Link
          href="/login"
          className="font-medium text-primary hover:text-primary-hover underline underline-offset-2"
        >
          {t("backToLogin")}
        </Link>
      </p>
    </div>
  );
}
