import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { EmptyState } from "@/components/empty-state";

export default async function DashboardPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);

  const t = await getTranslations("dashboard");
  const name = session.user.displayName ?? session.user.email;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("greeting", { name })}
        </p>
      </div>

      <EmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
    </div>
  );
}
