"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { THEME_STORAGE_KEY } from "@/lib/theme";

type Theme = "light" | "dark" | "system";

const THEMES: Array<{ value: Theme; Icon: LucideIcon }> = [
  { value: "light", Icon: Sun },
  { value: "dark", Icon: Moon },
  { value: "system", Icon: Monitor }
];

const TRIGGER =
  "flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition-fast hover:bg-primary-light hover:text-primary";

const ITEM =
  "flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-body text-text-primary outline-none transition-fast hover:bg-primary-light";

export function ThemeToggle() {
  const t = useTranslations("theme");
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "light" || saved === "dark" || saved === "system") setTheme(saved);
  }, []);

  function apply(next: Theme) {
    setTheme(next);
    localStorage.setItem(THEME_STORAGE_KEY, next);
    const dark =
      next === "dark" ||
      (next === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
  }

  const CurrentIcon = THEMES.find((item) => item.value === theme)?.Icon ?? Sun;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className={TRIGGER} aria-label={t("label")} title={t("label")}>
        <CurrentIcon size={18} aria-hidden />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          sideOffset={8}
          align="end"
          className="z-50 min-w-40 rounded-lg border border-border bg-surface p-1 shadow-large animate-fade-in"
        >
          {THEMES.map(({ value, Icon }) => (
            <DropdownMenu.Item key={value} onSelect={() => apply(value)} className={ITEM}>
              <Icon size={16} aria-hidden />
              <span className="flex-1">{t(value)}</span>
              {theme === value ? <Check size={14} aria-hidden /> : null}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
