import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import type { LocaleCode } from "@isbulkibris/data";
import { repos } from "@/lib/repos";
import { jobPostingJsonLd } from "@/lib/job-posting";
import { hreflangMap, localeUrl } from "@/lib/site";
import JobDetailPage from "@/components/JobDetailPage";

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

export default async function JobDetailPageServer({
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
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <JobDetailPage
        job={{
          title: job.title,
          organizationName: job.organizationName,
          citySlug: job.citySlug,
          description: job.description,
          publishedAt: job.publishedAt,
          verifiedOrganization: job.verifiedOrganization,
        }}
        locale={locale}
        url={url}
      />
    </>
  );
}
