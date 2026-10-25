"use client";

import { useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/navigation";

export function RegisterForm() {
  const t = useTranslations("auth.register");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const locale = useLocale();
  const router = useRouter();

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!acceptedTerms) {
      setError(t("termsRequired"));
      return;
    }

    setPending(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const displayName = String(form.get("display_name") ?? "").trim();
    const birthDate = String(form.get("birth_date") ?? "").trim();

    try {
      const response = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
          locale,
          accept_terms: true,
          ...(displayName ? { display_name: displayName } : {}),
          ...(birthDate ? { birth_date: birthDate } : {})
        })
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: { code?: string };
      } | null;

      if (!response.ok) {
        const code = payload?.error?.code ?? "INTERNAL_ERROR";
        setError(tErrors.has(code) ? tErrors(code) : tErrors("INTERNAL_ERROR"));
        return;
      }

      router.replace(`/${locale}/onboarding`);
      router.refresh();
    } catch {
      setError(tErrors("NETWORK_ERROR"));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="card w-full max-w-sm animate-fade-in">
      <h1 className="text-headline">{t("title")}</h1>
      <p className="mt-1 text-body-small text-text-secondary">{t("description")}</p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div className="space-y-1">
          <label htmlFor="display_name" className="input-label">
            {tCommon("displayName")}
          </label>
          <input
            id="display_name"
            name="display_name"
            type="text"
            maxLength={80}
            autoComplete="nickname"
            className="input"
            placeholder={tCommon("displayNamePlaceholder")}
          />
        </div>

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

        <div className="space-y-1">
          <label htmlFor="password" className="input-label">
            {tCommon("password")}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            maxLength={128}
            autoComplete="new-password"
            className="input"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="birth_date" className="input-label">
            {t("birthDate")}
          </label>
          <input
            id="birth_date"
            name="birth_date"
            type="date"
            autoComplete="bday"
            className="input"
          />
        </div>

        <label className="flex items-start gap-2">
          <input
            id="accept_terms"
            name="accept_terms"
            type="checkbox"
            required
            checked={acceptedTerms}
            onChange={(event) => setAcceptedTerms(event.target.checked)}
            className="checkbox mt-0.5"
          />
          <span className="text-body-small text-text-secondary leading-relaxed">
            {t("ageAndTermsPrefix")}{" "}
            <Link href="/terms" className="font-medium text-primary hover:text-primary-hover underline underline-offset-2">
              {t("termsLink")}
            </Link>{" "}
            {t("and")}{" "}
            <Link href="/privacy" className="font-medium text-primary hover:text-primary-hover underline underline-offset-2">
              {t("privacyLink")}
            </Link>
            .
          </span>
        </label>

        {error ? (
          <p role="alert" className="input-helper input-helper-error animate-fade-in">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary btn-md w-full"
        >
          {pending ? t("submitting") : t("submit")}
        </button>
      </form>

      <p className="mt-5 text-center text-body-small text-text-secondary">
        {t("hasAccount")}{" "}
        <Link href="/login" className="font-medium text-primary hover:text-primary-hover underline underline-offset-2">
          {t("login")}
        </Link>
      </p>
    </div>
  );
}