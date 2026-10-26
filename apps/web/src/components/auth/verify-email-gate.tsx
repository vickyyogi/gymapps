"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export function VerifyEmailGate({ email }: { email: string }) {
  const t = useTranslations("auth.verify");
  const tErrors = useTranslations("errors");
  const router = useRouter();

  const [pending, setPending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function resend() {
    setPending(true);
    setError(null);
    setResent(false);
    try {
      const response = await fetch("/api/v1/auth/verify/request", { method: "POST" });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: { code?: string };
        } | null;
        const code = payload?.error?.code ?? "INTERNAL_ERROR";
        setError(tErrors.has(code) ? tErrors(code) : tErrors("INTERNAL_ERROR"));
        return;
      }
      setResent(true);
    } catch {
      setError(tErrors("NETWORK_ERROR"));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="card w-full max-w-sm animate-fade-in">
      <h1 className="text-headline">{t("checkTitle")}</h1>
      <p className="mt-3 text-body-small text-text-secondary">{t("checkDescription")}</p>
      <p className="mt-2 text-body-small font-medium">{email}</p>

      {resent ? <p className="mt-3 text-body-small text-text-secondary">{t("resent")}</p> : null}
      {error ? (
        <p role="alert" className="input-helper input-helper-error animate-fade-in">
          {error}
        </p>
      ) : null}

      <div className="mt-6 space-y-3">
        <button
          type="button"
          onClick={resend}
          disabled={pending}
          className="btn btn-primary btn-md w-full"
        >
          {pending ? t("resending") : t("resend")}
        </button>
        <button
          type="button"
          onClick={() => router.refresh()}
          className="btn btn-secondary btn-md w-full"
        >
          {t("recheck")}
        </button>
      </div>
    </div>
  );
}
