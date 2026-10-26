import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { emailEnabled } from "@/lib/email";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { OnboardingWizard } from "@/components/phase4/onboarding-wizard";
import { VerifyEmailGate } from "@/components/auth/verify-email-gate";

export const dynamic = "force-dynamic";

export default async function OnboardingPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { locale } = await params;
  const { edit } = await searchParams;
  setRequestLocale(locale);
  const session = await getSession();
  if (!session) redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/onboarding`)}`);
  if (session.user.onboardingCompletedAt && edit !== "1") redirect(`/${locale}/dashboard`);

  const t = await getTranslations("app");

  // FR-01-08: verifikasi email wajib sebelum akses onboarding.
  const needsVerification = emailEnabled() && !session.user.emailVerifiedAt;

  return (
    <div className="flex min-h-screen flex-col items-center gap-8 px-4 py-8 sm:py-12">
      <div className="flex w-full max-w-2xl items-center justify-between">
        <span className="text-lg font-semibold tracking-tight">{t("name")}</span>
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </div>
      {needsVerification ? (
        <VerifyEmailGate email={session.user.email} />
      ) : (
        <OnboardingWizard />
      )}
    </div>
  );
}
