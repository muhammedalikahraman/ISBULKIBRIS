import { jobSearchSchema, type LocaleCode } from "@isbulkibris/data";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { repos } from "@/lib/repos";
import { hreflangMap, localeUrl } from "@/lib/site";

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
    <section>
      <h1 className="text-2xl font-semibold">{tNav("jobs")}</h1>
      <p className="mt-1 text-sm text-stone-500">
        {cities.length} şehir · {categories.length} kategori
      </p>
      {result.items.length === 0 ? (
        <p className="mt-8 text-stone-600">{t("empty")}</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {result.items.map((job) => (
            <li key={job.id} className="rounded-lg border border-stone-200 bg-white p-4">
              <Link href={`/ilan/${job.slug}`} className="font-medium">
                {job.title}
              </Link>
              <p className="text-sm text-stone-600">
                {job.organizationName} · {job.citySlug}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
