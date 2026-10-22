"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { THEME_STORAGE_KEY } from "@/lib/theme";

type Theme = "light" | "dark" | "system";
const themes: Theme[] = ["light", "dark", "system"];

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

  return (
    <div
      role="group"
      aria-label={t("label")}
      className="flex rounded-lg border border-border bg-card p-0.5 text-xs"
    >
      {themes.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => apply(option)}
          aria-pressed={theme === option}
          className="rounded-md px-2 py-1 text-muted-foreground aria-pressed:bg-muted aria-pressed:text-foreground"
        >
          {t(option)}
        </button>
      ))}
    </div>
  );
}
