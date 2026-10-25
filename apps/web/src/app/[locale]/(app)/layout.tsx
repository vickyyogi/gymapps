import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { AppSidebar, type NavItem } from "@/components/app-sidebar";
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

  const tNav = await getTranslations("nav");

  const items: NavItem[] = [
    { href: "/dashboard", key: "dashboard", label: tNav("dashboard") },
    { href: "/workouts", key: "workouts", label: tNav("workouts") },
    { href: "/programs", key: "programs", label: tNav("programs") },
    { href: "/exercises", key: "exercises", label: tNav("exercises") },
    { href: "/progress", key: "progress", label: tNav("progress") },
    { href: "/coach", key: "coach", label: tNav("coach") },
    { href: "/recommendations", key: "recommendations", label: tNav("recommendations") },
    { href: "/exports", key: "exports", label: tNav("exports") },
    { href: "/settings", key: "settings", label: tNav("settings") },
    ...(session.user.role === "admin"
      ? [{ href: "/admin/exercises", key: "admin", label: tNav("admin") }]
      : [])
  ];

  return (
    <div className="min-h-screen">
      <AppSidebar items={items} userName={session.user.displayName ?? session.user.email} />
      <main className="px-4 py-8 lg:pl-72">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
      <PwaRegister />
    </div>
  );
}
