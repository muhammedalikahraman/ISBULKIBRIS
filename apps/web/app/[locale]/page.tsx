import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { hreflangMap, localeUrl } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "site" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  
  const title = t("name");
  const description = t("tagline");
  const canonicalUrl = localeUrl(locale);
  
  return {
    title,
    description,
    keywords: ["iş ilanları", "Kuzey Kıbrıs", "iş bul", "kariyer", "employment", "Northern Cyprus", locale],
    authors: [{ name: "İşBulKıbrıs" }],
    creator: "İşBulKıbrıs",
    publisher: "İşBulKıbrıs",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(canonicalUrl),
    alternates: {
      canonical: canonicalUrl,
      languages: hreflangMap(),
    },
    openGraph: {
      type: "website",
      locale: locale,
      url: canonicalUrl,
      title,
      description,
      siteName: "İşBulKıbrıs",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
    },
  };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("site");
  const tNav = await getTranslations("nav");
  const tHome = await getTranslations("home");
  
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-3xl">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            {t("name")}
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            {t("tagline")}
          </p>
          <div className="flex gap-4">
            <Link 
              href="/ilanlar" 
              className="px-6 py-3 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600"
            >
              {tNav("jobs")}
            </Link>
            <Link 
              href="/ilanlar" 
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
            >
              İşveren Girişi
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-8">
          <div>
            <div className="text-4xl font-bold text-gray-900 mb-2">189,791</div>
            <div className="text-sm text-gray-600">Aktif İstihdam</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-gray-900 mb-2">%4.7</div>
            <div className="text-sm text-gray-600">İşsizlik Oranı</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-gray-900 mb-2">%75.4</div>
            <div className="text-sm text-gray-600">Hizmetler Sektörü</div>
          </div>
        </div>
      </section>

      {/* Info Cards */}
      <section className="py-16 border-t border-gray-200">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 border border-gray-200 rounded-lg">
            <h3 className="font-semibold mb-2">{tHome("candidates_title")}</h3>
            <p className="text-sm text-gray-600">{tHome("candidates_desc")}</p>
          </div>
          <div className="p-6 border border-gray-200 rounded-lg">
            <h3 className="font-semibold mb-2">{tHome("employers_title")}</h3>
            <p className="text-sm text-gray-600">{tHome("employers_desc")}</p>
          </div>
          <div className="p-6 border border-gray-200 rounded-lg">
            <h3 className="font-semibold mb-2">{tHome("fast_title")}</h3>
            <p className="text-sm text-gray-600">{tHome("fast_desc")}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
