"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Activity,
  BookOpen,
  CalendarRange,
  Download,
  Dumbbell,
  LayoutDashboard,
  Lightbulb,
  Menu,
  MessageSquare,
  Settings,
  ShieldCheck,
  X,
  type LucideIcon
} from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";
import { LogoutButton } from "@/components/logout-button";

const ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  workouts: Dumbbell,
  programs: CalendarRange,
  exercises: BookOpen,
  progress: Activity,
  coach: MessageSquare,
  recommendations: Lightbulb,
  exports: Download,
  settings: Settings,
  admin: ShieldCheck
};

export type NavItem = { href: string; key: string; label: string };

const ROW =
  "flex items-center gap-3 rounded-md px-3 py-2 text-body font-medium transition-fast";

function NavLinks({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const Icon = ICONS[item.key] ?? Menu;
        const active =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`${ROW} ${
              active
                ? "bg-primary-light text-primary border-l-2 border-primary"
                : "text-text-secondary hover:bg-primary-light hover:text-text-primary border-l-2 border-transparent"
            }`}
          >
            <Icon size={18} aria-hidden className="shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarBody({
  items,
  userName,
  onNavigate
}: {
  items: NavItem[];
  userName: string;
  onNavigate?: () => void;
}) {
  const t = useTranslations("app");
  const locale = useLocale();
  return (
    <div className="flex h-full flex-col">
      <Link href="/dashboard" className="flex items-center gap-2 px-4 py-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Dumbbell size={18} aria-hidden />
        </span>
        <span className="text-subhead font-semibold tracking-tight">{t("name")}</span>
      </Link>
      <div className="flex-1 overflow-y-auto px-2">
        <NavLinks items={items} onNavigate={onNavigate} />
      </div>
      <div className="border-t border-border p-3">
        <p className="truncate px-2 text-body-small text-text-secondary">{userName}</p>
        <div className="mt-2 flex items-center gap-1">
          <NotificationBell locale={locale} />
          <LocaleSwitcher />
          <ThemeToggle />
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}

export function AppSidebar({ items, userName }: { items: NavItem[]; userName: string }) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile: top bar with drawer trigger */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur lg:hidden">
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger asChild>
            <button
              type="button"
              aria-label={t("menu")}
              className="flex h-9 w-9 items-center justify-center rounded-md text-text-primary transition-fast hover:bg-primary-light"
            >
              <Menu size={20} aria-hidden />
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 animate-fade-in" />
            <Dialog.Content className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-surface shadow-overlay animate-slide-up">
              <Dialog.Title className="sr-only">{t("menu")}</Dialog.Title>
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label={t("close")}
                  className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-primary-light"
                >
                  <X size={18} aria-hidden />
                </button>
              </Dialog.Close>
              <SidebarBody
                items={items}
                userName={userName}
                onNavigate={() => setOpen(false)}
              />
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
        <div className="flex items-center gap-1">
          <NotificationBell locale={locale} />
          <ThemeToggle />
        </div>
      </header>

      {/* Desktop: fixed sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-border bg-surface lg:block">
        <SidebarBody items={items} userName={userName} />
      </aside>
    </>
  );
}
