"use client";

import { useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/navigation";

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const t = useTranslations("auth.login");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const locale = useLocale();
  const router = useRouter();

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password")
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

      router.replace(nextPath ?? `/${locale}/dashboard`);
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
            autoComplete="current-password"
            className="input"
          />
        </div>

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
        {t("noAccount")}{" "}
        <Link href="/register" className="font-medium text-primary hover:text-primary-hover underline underline-offset-2">
          {t("register")}
        </Link>
      </p>
    </div>
  );
}