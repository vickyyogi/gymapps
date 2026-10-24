import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function TermsPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("terms");

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-1 text-xs text-muted-foreground">{t("effectiveDate")}</p>
        </div>
        <Link
          href="/dashboard"
          className="rounded-lg border border-border px-3 py-1.5 text-sm hover:border-primary"
        >
          {t("backToApp")}
        </Link>
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">{t("intro")}</p>

      <div className="space-y-5 rounded-2xl border border-border bg-card p-6">
        <section className="space-y-1.5">
          <h2 className="text-base font-medium">{t("section1Title")}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("section1Body")}</p>
        </section>

        <section className="space-y-1.5">
          <h2 className="text-base font-medium">{t("section2Title")}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("section2Body")}</p>
        </section>

        <section className="space-y-1.5">
          <h2 className="text-base font-medium">{t("section3Title")}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("section3Body")}</p>
        </section>

        <section className="space-y-1.5">
          <h2 className="text-base font-medium">{t("section4Title")}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("section4Body")}</p>
        </section>
      </div>
    </main>
  );
}
