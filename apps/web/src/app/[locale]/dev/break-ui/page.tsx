import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { BreakUiHarness } from "./break-ui-harness";

// Dev-only. Not reachable in production builds.
export default async function BreakUiPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const { locale } = await params;
  setRequestLocale(locale);
  return <BreakUiHarness />;
}
