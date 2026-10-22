"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";

export function LogoutButton() {
  const locale = useLocale();
  const t = useTranslations("nav");
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
    } finally {
      window.location.assign(`/${locale}/login`);
    }
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={pending}
      className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-60"
    >
      {t("logout")}
    </button>
  );
}
