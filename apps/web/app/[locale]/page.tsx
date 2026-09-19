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
    <section className="max-w-4xl mx-auto">
      <div className="text-center py-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">{t("name")}</h1>
        <p className="text-xl text-stone-600 mb-8">{t("tagline")}</p>
        <Link 
          href="/ilanlar" 
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          {tNav("jobs")}
        </Link>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6 mt-12">
        <div className="p-6 border border-stone-200 rounded-lg">
          <h3 className="font-semibold mb-2">{tHome("candidates_title")}</h3>
          <p className="text-sm text-stone-600">{tHome("candidates_desc")}</p>
        </div>
        <div className="p-6 border border-stone-200 rounded-lg">
          <h3 className="font-semibold mb-2">{tHome("employers_title")}</h3>
          <p className="text-sm text-stone-600">{tHome("employers_desc")}</p>
        </div>
        <div className="p-6 border border-stone-200 rounded-lg">
          <h3 className="font-semibold mb-2">{tHome("fast_title")}</h3>
          <p className="text-sm text-stone-600">{tHome("fast_desc")}</p>
        </div>
      </div>
    </section>
  );
}
