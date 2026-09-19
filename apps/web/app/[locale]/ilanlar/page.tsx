import { jobSearchSchema, type LocaleCode } from "@isbulkibris/data";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { repos } from "@/lib/repos";
import { hreflangMap, localeUrl } from "@/lib/site";
import JobListPage from "@/components/JobListPage";

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
    <JobListPage
      jobs={result.items}
      cities={cities}
      categories={categories}
      locale={locale}
    />
  );
}
