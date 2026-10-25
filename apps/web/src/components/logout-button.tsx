"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { LogOut } from "lucide-react";

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
      aria-label={t("logout")}
      title={t("logout")}
      className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition-fast hover:bg-primary-light hover:text-text-primary"
    >
      <LogOut size={18} aria-hidden />
    </button>
  );
}
