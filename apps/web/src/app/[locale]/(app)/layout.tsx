import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getSession } from "@/lib/auth/session";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";
import { PwaRegister } from "@/components/pwa-register";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) {
    const pathname = (await headers()).get("x-pathname") ?? `/${locale}/dashboard`;
    redirect(`/${locale}/login?next=${encodeURIComponent(pathname)}`);
  }
  if (!session.user.onboardingCompletedAt) {
    redirect(`/${locale}/onboarding`);
  }

  const [tNav, tApp] = await Promise.all([
    getTranslations("nav"),
    getTranslations("app")
  ]);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
          <Link href="/dashboard" className="text-sm font-semibold tracking-tight">
            {tApp("name")}
          </Link>
          <nav className="flex min-w-0 flex-1 items-center gap-3 overflow-x-auto whitespace-nowrap">
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
              {tNav("dashboard")}
            </Link>
            <Link href="/workouts" className="text-sm text-muted-foreground hover:text-foreground">
              {tNav("workouts")}
            </Link>
            <Link href="/programs" className="text-sm text-muted-foreground hover:text-foreground">
              {tNav("programs")}
            </Link>
            <Link href="/exercises" className="text-sm text-muted-foreground hover:text-foreground">
              {tNav("exercises")}
            </Link>
            <Link href="/progress" className="text-sm text-muted-foreground hover:text-foreground">
              {tNav("progress")}
            </Link>
            <Link href="/coach" className="text-sm text-muted-foreground hover:text-foreground">
              {tNav("coach")}
            </Link>
            <Link href="/recommendations" className="text-sm text-muted-foreground hover:text-foreground">
              {tNav("recommendations")}
            </Link>
            <Link href="/exports" className="text-sm text-muted-foreground hover:text-foreground">
              {tNav("exports")}
            </Link>
            {session.user.role === "admin" ? (
              <Link href="/admin/exercises" className="text-sm text-muted-foreground hover:text-foreground">
                {tNav("admin")}
              </Link>
            ) : null}
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <NotificationBell locale={locale} />
            <LocaleSwitcher />
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      <PwaRegister />
    </div>
  );
}
