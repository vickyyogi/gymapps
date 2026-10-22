"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("locale");

  return (
    <nav aria-label={t("label")} className="flex gap-2 text-xs">
      {(["id", "en"] as const)
        .filter((option) => option !== locale)
        .map((option) => (
          <Link
            key={option}
            href={pathname}
            locale={option}
            className="rounded-md border border-border px-2 py-1 text-muted-foreground hover:text-foreground"
          >
            {t(option)}
          </Link>
        ))}
    </nav>
  );
}
