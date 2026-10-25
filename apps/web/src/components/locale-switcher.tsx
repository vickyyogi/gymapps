"use client";

import { useLocale, useTranslations } from "next-intl";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, Globe } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";

const TRIGGER =
  "flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition-fast hover:bg-primary-light hover:text-primary";

const ITEM =
  "flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-body text-text-primary outline-none transition-fast hover:bg-primary-light";

export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("locale");

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className={TRIGGER} aria-label={t("label")} title={t("label")}>
        <Globe size={18} aria-hidden />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          sideOffset={8}
          align="end"
          className="z-50 min-w-40 rounded-lg border border-border bg-surface p-1 shadow-large animate-fade-in"
        >
          {(["id", "en"] as const).map((option) => (
            <DropdownMenu.Item key={option} asChild>
              <Link href={pathname} locale={option} className={ITEM}>
                <span className="flex-1">{t(option)}</span>
                {option === locale ? <Check size={14} aria-hidden /> : null}
              </Link>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
