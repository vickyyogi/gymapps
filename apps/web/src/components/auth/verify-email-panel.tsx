"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function VerifyEmailPanel({ token }: { token?: string }) {
  const t = useTranslations("auth.verify");
  const tErrors = useTranslations("errors");

  const [state, setState] = useState<"verifying" | "success" | "invalid">("verifying");
  const started = useRef(false);

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }
    if (started.current) return;
    started.current = true;

    fetch("/api/v1/auth/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token })
    })
      .then((response) => setState(response.ok ? "success" : "invalid"))
      .catch(() => setState("invalid"));
  }, [token]);

  return (
    <div className="card w-full max-w-sm animate-fade-in">
      <h1 className="text-headline">{t("title")}</h1>
      <p className="mt-3 text-body-small text-text-secondary">
        {state === "verifying"
          ? t("verifying")
          : state === "success"
            ? t("success")
            : tErrors("INVALID_TOKEN")}
      </p>
      {state !== "verifying" ? (
        <p className="mt-5 text-center text-body-small text-text-secondary">
          <Link
            href={state === "success" ? "/onboarding" : "/login"}
            className="font-medium text-primary hover:text-primary-hover underline underline-offset-2"
          >
            {t(state === "success" ? "continue" : "backToLogin")}
          </Link>
        </p>
      ) : null}
    </div>
  );
}
