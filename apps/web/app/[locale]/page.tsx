import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { hreflangMap, localeUrl } from "@/lib/site";
import { repos } from "@/lib/repos";
import { JobSearchBar } from "@/components/job-search-bar";
import {
  UsersIcon,
  BriefcaseIcon,
  ZapIcon,
  ShieldIcon,
  TrendingUpIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  SearchIcon,
  MapPinIcon,
  StarIcon,
} from "@/components/icons";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "site" });
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
    formatDetection: { email: false, address: false, telephone: false },
    metadataBase: new URL(canonicalUrl),
    alternates: { canonical: canonicalUrl, languages: hreflangMap() },
    openGraph: {
      type: "website",
      locale: locale,
      url: canonicalUrl,
      title,
      description,
      siteName: "İşBulKıbrıs",
    },
    twitter: { card: "summary_large_image", title, description },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
    },
    verification: { google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION },
  };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("site");
  const tNav = await getTranslations("nav");
  const tHome = await getTranslations("home");

  // Fetch cities and categories for the search bar
  const db = await repos();
  const [cities, categories] = await Promise.all([
    db.catalog.listCities(locale as any),
    db.catalog.listCategories(locale as any),
  ]);

  const stats = [
    { icon: TrendingUpIcon, value: "189,791", label: tHome("stat_employment"), color: "text-primary-600" },
    { icon: MapPinIcon, value: `${cities.length}`, label: tHome("stat_cities"), color: "text-accent-600" },
    { icon: BriefcaseIcon, value: `${categories.length}`, label: tHome("stat_categories"), color: "text-primary-600" },
  ];

  const features = [
    {
      icon: UsersIcon,
      title: tHome("candidates_title"),
      desc: tHome("candidates_desc"),
      color: "from-primary-500 to-primary-700",
    },
    {
      icon: BriefcaseIcon,
      title: tHome("employers_title"),
      desc: tHome("employers_desc"),
      color: "from-accent-500 to-accent-700",
    },
    {
      icon: ZapIcon,
      title: tHome("fast_title"),
      desc: tHome("fast_desc"),
      color: "from-primary-400 to-primary-600",
    },
  ];

  return (
    <div className="-mx-4 -my-8 sm:-mx-6 lg:-mx-8">
      {/* ── Hero Section ── */}
      <section className="hero-mesh relative overflow-hidden">
        {/* Grid pattern overlay */}
        <div className="grid-pattern absolute inset-0 opacity-40" />

        {/* Decorative blobs */}
        <div className="absolute -right-20 top-10 h-72 w-72 rounded-full bg-primary-200/30 blur-3xl" />
        <div className="absolute -left-20 bottom-10 h-72 w-72 rounded-full bg-accent-200/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white/60 px-4 py-1.5 text-sm font-medium text-primary-700 backdrop-blur-sm animate-fade-in-down">
              <span className="flex h-2 w-2 rounded-full bg-success-500 animate-pulse" />
              {tHome("hero_badge")}
            </div>

            {/* Heading */}
            <h1 className="font-display text-4xl font-bold leading-tight text-primary-950 sm:text-5xl lg:text-6xl animate-fade-in-up">
              {tHome("hero_title")}
            </h1>

            {/* Subtitle */}
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600 animate-fade-in-up stagger-1">
              {tHome("hero_subtitle")}
            </p>
          </div>

          {/* Search bar */}
          <div className="mx-auto mt-10 max-w-4xl animate-fade-in-up stagger-2">
            <JobSearchBar
              cities={cities}
              categories={categories}
              searchPlaceholder={tHome("search_placeholder")}
              cityPlaceholder={tHome("search_city")}
              categoryPlaceholder={tHome("search_category")}
              buttonText={tHome("search_button")}
              locale={locale}
            />
          </div>

          {/* Quick stats */}
          <div className="mx-auto mt-16 grid max-w-3xl grid-cols-3 gap-4 sm:gap-8 animate-fade-in-up stagger-3">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div className="font-display text-2xl font-bold text-primary-950 sm:text-3xl">
                  {stat.value}
                </div>
                <div className="mt-1 text-xs text-gray-500 sm:text-sm">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature Cards ── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-bold text-primary-950 sm:text-4xl">
            {tHome("features_title")}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-gray-600">
            {tHome("features_subtitle")}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature, i) => (
            <div
              key={i}
              className={`card-lift group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 animate-fade-in-up stagger-${i + 1}`}
            >
              {/* Gradient icon */}
              <div className={`mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.color} shadow-lg`}>
                <feature.icon className="h-7 w-7 text-white" />
              </div>

              <h3 className="font-display text-xl font-bold text-gray-900">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                {feature.desc}
              </p>

              {/* Decorative corner */}
              <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${feature.color} opacity-5 transition-opacity group-hover:opacity-10`} />
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="bg-primary-950 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
              {tHome("how_title")}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-primary-200">
              {tHome("how_subtitle")}
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              { num: "01", title: tHome("step1_title"), desc: tHome("step1_desc") },
              { num: "02", title: tHome("step2_title"), desc: tHome("step2_desc") },
              { num: "03", title: tHome("step3_title"), desc: tHome("step3_desc") },
            ].map((step, i) => (
              <div key={i} className="relative">
                <div className="font-display text-5xl font-bold text-primary-700">
                  {step.num}
                </div>
                <h3 className="mt-4 font-display text-xl font-bold text-white">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-primary-200">
                  {step.desc}
                </p>
                {i < 2 && (
                  <div className="absolute right-0 top-6 hidden h-px w-12 bg-primary-700 md:block" />
                )}
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-12 text-center">
            <Link
              href="/ilanlar"
              className="inline-flex items-center gap-2 rounded-xl bg-accent-500 px-8 py-4 text-base font-semibold text-primary-950 shadow-lg shadow-accent-500/20 transition-all hover:bg-accent-400 hover:shadow-xl hover:shadow-accent-500/30"
            >
              {tHome("cta_browse")}
              <ArrowRightIcon className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Trust/Security banner ── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center gap-8 rounded-2xl border border-gray-200 bg-gradient-to-r from-primary-50 to-accent-50 p-8 sm:flex-row sm:gap-12">
          <div className="flex items-center gap-3">
            <ShieldIcon className="h-8 w-8 text-primary-600" />
            <span className="text-sm font-medium text-gray-700">{tHome("trust_verified")}</span>
          </div>
          <div className="hidden h-8 w-px bg-gray-200 sm:block" />
          <div className="flex items-center gap-3">
            <CheckCircleIcon className="h-8 w-8 text-success-600" />
            <span className="text-sm font-medium text-gray-700">{tHome("trust_quality")}</span>
          </div>
          <div className="hidden h-8 w-px bg-gray-200 sm:block" />
          <div className="flex items-center gap-3">
            <StarIcon className="h-8 w-8 text-accent-500" />
            <span className="text-sm font-medium text-gray-700">{tHome("trust_rated")}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
