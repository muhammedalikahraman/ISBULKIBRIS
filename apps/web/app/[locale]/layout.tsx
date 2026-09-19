import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { routing } from "@/i18n/routing";
import { LOCALE_DIR, type LocaleCode } from "@isbulkibris/data";
import { hreflangMap, localeUrl } from "@/lib/site";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import "../globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-inter",
});

const display = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-display",
  weight: ["600", "700", "800"],
});

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

  const navItems = [
    { href: "/ilanlar" as const, label: tNav("jobs") },
  ];

  const footerNavItems = [
    { href: "/ilanlar" as const, label: tNav("jobs") },
    { href: "/" as const, label: tNav("home") },
  ];

  return (
    <html lang={locale} dir={dir} className={`${inter.variable} ${display.variable}`}>
      <body className="font-sans antialiased">
        <NextIntlClientProvider messages={messages}>
          <a href="#main" className="skip-link">
            {locale === "tr" ? "İçeriğe atla" : locale === "ru" ? "Перейти к содержимому" : locale === "he" ? "דלג לתוכן" : "Skip to content"}
          </a>
          <Header
            currentLocale={locale}
            navItems={navItems}
            employerLabel={tNav("employer")}
          />
          <main id="main" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </main>
          <Footer
            currentLocale={locale}
            siteName={tSite("name")}
            tagline={tSite("tagline")}
            navItems={footerNavItems}
            copyright={locale === "tr" ? "Tüm hakları saklıdır." : locale === "ru" ? "Все права защищены." : locale === "he" ? "כל הזכויות שמורות." : "All rights reserved."}
          />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
