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
          {/* Professional Header */}
          <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-primary-500/20 shadow-sm">
            <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-primary-glow group-hover:scale-105 transition-transform">
                  <span className="text-white font-bold text-lg">İ</span>
                </div>
                <span className="font-bold text-xl text-text-primary bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent">
                  {tSite("name")}
                </span>
              </Link>
              
              <div className="flex items-center gap-4">
                <Link 
                  href="/ilanlar" 
                  className="px-4 py-2 rounded-lg text-sm font-medium text-text-primary hover:bg-primary-500/10 transition-colors"
                >
                  {tNav("jobs")}
                </Link>
                <Link 
                  href="/ilanlar" 
                  className="px-6 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg text-sm font-medium shadow-primary-glow hover:shadow-lg transition-all"
                >
                  İşveren Girişi
                </Link>
              </div>
            </nav>
          </header>
          
          {/* Main Content */}
          <main className="min-h-screen">{children}</main>
          
          {/* Professional Footer */}
          <footer className="bg-gradient-to-br from-surface-light to-surface-cream border-t border-primary-500/20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="md:col-span-2">
                  <h3 className="text-xl font-bold text-text-primary mb-4">{tSite("name")}</h3>
                  <p className="text-text-secondary text-sm mb-4">
                    Kıbrıs'ın önde gelen profesyonel iş istihdam platformu
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary mb-4">Hızlı Linkler</h4>
                  <ul className="space-y-2 text-sm text-text-secondary">
                    <li><Link href="/ilanlar" className="hover:text-primary-500 transition-colors">İlanlar</Link></li>
                    <li><Link href="/" className="hover:text-primary-500 transition-colors">Ana Sayfa</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary mb-4">İletişim</h4>
                  <ul className="space-y-2 text-sm text-text-secondary">
                    <li>info@isbulkibris.com</li>
                    <li>Lefkoşa, KKTC</li>
                  </ul>
                </div>
              </div>
              <div className="mt-8 pt-8 border-t border-border/50 text-center text-sm text-text-secondary">
                <p>© 2026 {tSite("name")}. Tüm hakları saklıdır.</p>
              </div>
            </div>
          </footer>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
