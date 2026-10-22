import { setRequestLocale } from "next-intl/server";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { next } = await searchParams;
  const safeNext =
    next && next.startsWith(`/${locale}/`) && !next.startsWith("//") ? next : undefined;

  return <LoginForm nextPath={safeNext} />;
}
