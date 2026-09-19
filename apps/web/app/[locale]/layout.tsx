import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { LOCALE_DIR, type LocaleCode } from "@isbulkibris/data";
import { hreflangMap, localeUrl } from "@/lib/site";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "site" });
  return {
    title: { default: t("name"), template: `%s · ${t("name")}` },
    description: t("tagline"),
    alternates: {
      canonical: localeUrl(locale),
      languages: hreflangMap(),
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();
  const dir = LOCALE_DIR[locale as LocaleCode];
  const tSite = await getTranslations("site");
  const tNav = await getTranslations("nav");

  return (
    <html lang={locale} dir={dir}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <header className="topbar">
            <nav>
              <Link href="/" className="brand"><span className="brand-mark" aria-hidden="true">i</span>{tSite("name")}</Link>
              <div className="nav-links">
                <Link href="/ilanlar">{tNav("jobs")}</Link>
                <a href="#ilanlar">Kategoriler</a>
                <a href="#hakkimizda">Hakkımızda</a>
                <Link href="/ilanlar" className="nav-cta">{tNav("employer")} <span aria-hidden="true">↗</span></Link>
              </div>
            </nav>
          </header>
          <main>{children}</main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
