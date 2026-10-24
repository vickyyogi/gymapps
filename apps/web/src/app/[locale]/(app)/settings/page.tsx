import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { SettingsPanel } from "@/components/settings/settings-panel";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);

  return <SettingsPanel email={session.user.email} />;
}
