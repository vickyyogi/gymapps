import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { DashboardOverview } from "@/components/phase4/dashboard-overview";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);

  const name = session.user.displayName ?? session.user.email;
  return <DashboardOverview name={name} />;
}
