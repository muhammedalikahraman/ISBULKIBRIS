import { jobSearchSchema, type LocaleCode } from "@isbulkibris/data";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { repos } from "@/lib/repos";
import { hreflangMap, localeUrl } from "@/lib/site";
import { Link } from "@/i18n/navigation";

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
  const raw = await searchParams;
  const parsed = jobSearchSchema.safeParse({
    locale,
    q: typeof raw.q === "string" ? raw.q : undefined,
    city: typeof raw.city === "string" ? raw.city : undefined,
    category: typeof raw.category === "string" ? raw.category : undefined,
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{tNav("jobs")}</h1>
        <p className="text-sm text-gray-600">
          {cities.length} şehir · {categories.length} kategori
        </p>
      </div>

      {result.items.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-gray-600">{t("empty")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {result.items.map((job) => (
            <Link
              key={job.id}
              href={`/ilan/${job.slug}`}
              className="block p-6 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {job.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>{job.organizationName}</span>
                    <span>·</span>
                    <span>{job.citySlug}</span>
                  </div>
                </div>
                {job.verifiedOrganization && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    Doğrulanmış
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
