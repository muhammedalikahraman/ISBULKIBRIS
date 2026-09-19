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
          <header className="border-b border-gray-200 bg-white">
            <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
              <Link href="/" className="text-xl font-semibold text-gray-900">
                {tSite("name")}
              </Link>
              <div className="flex items-center gap-6">
                <Link href="/ilanlar" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                  {tNav("jobs")}
                </Link>
                <Link href="/ilanlar" className="px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600">
                  İşveren Girişi
                </Link>
              </div>
            </nav>
          </header>
          <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
          <footer className="border-t border-gray-200 bg-white mt-16">
            <div className="mx-auto max-w-6xl px-6 py-8">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">© 2026 {tSite("name")}</p>
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <Link href="/ilanlar" className="hover:text-gray-900">İlanlar</Link>
                  <Link href="/" className="hover:text-gray-900">Ana Sayfa</Link>
                </div>
              </div>
            </div>
          </footer>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
