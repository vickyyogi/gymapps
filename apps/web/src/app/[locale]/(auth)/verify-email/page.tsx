import { setRequestLocale } from "next-intl/server";
import { VerifyEmailPanel } from "@/components/auth/verify-email-panel";

export default async function VerifyEmailPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { token } = await searchParams;
  return <VerifyEmailPanel token={token} />;
}
