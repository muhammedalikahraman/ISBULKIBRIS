import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import type { LocaleCode } from "@isbulkibris/data";
import { repos } from "@/lib/repos";
import { jobPostingJsonLd } from "@/lib/job-posting";
import { hreflangMap, localeUrl } from "@/lib/site";
import { Link } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const db = await repos();
  const job = await db.jobs.getBySlug(locale as LocaleCode, slug);
  if (!job) return { title: "404" };
  const path = `/ilan/${slug}`;
  return {
    title: job.title,
    description: job.description.slice(0, 160),
    alternates: {
      canonical: localeUrl(locale, path),
      languages: hreflangMap(path),
    },
  };
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const db = await repos();
  const job = await db.jobs.getBySlug(locale as LocaleCode, slug);
  if (!job) notFound();
  const url = localeUrl(locale, `/ilan/${slug}`);
  const jsonLd = jobPostingJsonLd(job, locale, url);

  return (
    <div className="space-y-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      
      <Link 
        href={`/${locale}/ilanlar`}
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        ← İlanlara Dön
      </Link>

      <div className="border border-gray-200 rounded-lg p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            {job.verifiedOrganization && (
              <span className="inline-block text-xs bg-green-100 text-green-800 px-2 py-1 rounded mb-3">
                Doğrulanmış İşveren
              </span>
            )}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {job.title}
            </h1>
            <div className="flex items-center gap-4 text-gray-600">
              <span className="font-medium">{job.organizationName}</span>
              <span>·</span>
              <span>{job.citySlug}</span>
            </div>
          </div>
        </div>

        <div className="prose prose-gray max-w-none whitespace-pre-wrap text-gray-700">
          {job.description}
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <button className="w-full px-6 py-3 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600">
            Başvuru Yap
          </button>
        </div>
      </div>
    </div>
  );
}
