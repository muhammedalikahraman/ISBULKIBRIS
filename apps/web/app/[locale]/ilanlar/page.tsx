import { jobSearchSchema, type LocaleCode } from "@isbulkibris/data";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { repos } from "@/lib/repos";
import { hreflangMap, localeUrl } from "@/lib/site";
import { JobCard } from "@/components/job-card";
import { JobFilters } from "@/components/job-filters";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/components/empty-state";
import { SearchIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  const tSite = await getTranslations({ locale, namespace: "site" });
  return {
    title: t("jobs"),
    description: tSite("tagline"),
    alternates: {
      canonical: localeUrl(locale, "/ilanlar"),
      languages: hreflangMap("/ilanlar"),
    },
  };
}

export default async function JobsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("jobs");
  const tNav = await getTranslations("nav");
  const tFilters = await getTranslations("filters");
  const raw = await searchParams;

  const parsed = jobSearchSchema.safeParse({
    locale,
    q: typeof raw.q === "string" ? raw.q : undefined,
    city: typeof raw.city === "string" ? raw.city : undefined,
    category: typeof raw.category === "string" ? raw.category : undefined,
    remote: typeof raw.remote === "string" ? raw.remote : undefined,
    cursor: typeof raw.cursor === "string" ? raw.cursor : undefined,
  });
  const query = parsed.success
    ? parsed.data
    : { locale: locale as LocaleCode, limit: 20 };

  const db = await repos();
  const [result, cities, categories] = await Promise.all([
    db.jobs.search(query),
    db.catalog.listCities(locale as LocaleCode),
    db.catalog.listCategories(locale as LocaleCode),
  ]);

  // Build lookup maps for display names
  const cityMap = new Map(cities.map((c) => [c.slug, c.name]));
  const categoryMap = new Map(categories.map((c) => [c.slug, c.name]));

  const filterLabels = {
    filters: tFilters("title"),
    city: tFilters("city"),
    category: tFilters("category"),
    remote: tFilters("remote"),
    allCities: tFilters("all_cities"),
    allCategories: tFilters("all_categories"),
    allTypes: tFilters("all_types"),
    remote: tFilters("remote_opt_remote"),
    hybrid: tFilters("remote_opt_hybrid"),
    onsite: tFilters("remote_opt_onsite"),
    clear: tFilters("clear"),
  };

  const paginationLabels = {
    next: t("next"),
    prev: t("prev"),
    page: t("page"),
  };

  return (
    <div className="py-6">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-primary-950 sm:text-4xl">
          {tNav("jobs")}
        </h1>
        <p className="mt-2 flex items-center gap-2 text-sm text-gray-500">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 font-medium text-primary-700">
            {cities.length} {locale === "tr" ? "şehir" : locale === "ru" ? "городов" : locale === "he" ? "ערים" : "cities"}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-50 px-3 py-1 font-medium text-accent-700">
            {categories.length} {locale === "tr" ? "kategori" : locale === "ru" ? "категорий" : locale === "he" ? "קטגוריות" : "categories"}
          </span>
          {result.items.length > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-600">
              {result.items.length} {locale === "tr" ? "ilan" : locale === "ru" ? "вакансий" : locale === "he" ? "משרות" : "jobs"}
            </span>
          )}
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar filters */}
        <aside className="lg:w-64 lg:flex-shrink-0">
          <div className="lg:sticky lg:top-20">
            <JobFilters
              cities={cities}
              categories={categories}
              currentCity={typeof raw.city === "string" ? raw.city : undefined}
              currentCategory={typeof raw.category === "string" ? raw.category : undefined}
              currentRemote={typeof raw.remote === "string" ? raw.remote : undefined}
              locale={locale}
              labels={filterLabels}
            />
          </div>
        </aside>

        {/* Job listings */}
        <div className="flex-1">
          {result.items.length === 0 ? (
            <EmptyState
              title={t("empty")}
              description={locale === "tr" ? "Filtreleri değiştirerek tekrar deneyin." : locale === "ru" ? "Попробуйте изменить фильтры." : locale === "he" ? "נסה לשנות את המסננים." : "Try adjusting your filters."}
            />
          ) : (
            <>
              <div className="grid gap-4">
                {result.items.map((job, i) => (
                  <div key={job.id} className={`animate-fade-in-up stagger-${Math.min(i + 1, 5)}`}>
                    <JobCard
                      job={job}
                      cityName={cityMap.get(job.citySlug)}
                      categoryName={categoryMap.get(job.categorySlug)}
                      locale={locale}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <Pagination
                  nextCursor={result.nextCursor}
                  hasItems={result.items.length > 0}
                  labels={paginationLabels}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
