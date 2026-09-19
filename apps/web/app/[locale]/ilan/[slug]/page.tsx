import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import type { LocaleCode } from "@isbulkibris/data";
import { repos } from "@/lib/repos";
import { jobPostingJsonLd } from "@/lib/job-posting";
import { hreflangMap, localeUrl } from "@/lib/site";

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
    <article className="rounded-lg border border-stone-200 bg-white p-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h1 className="text-2xl font-semibold">{job.title}</h1>
      <p className="mt-1 text-stone-600">
        {job.organizationName}
        {job.verifiedOrganization ? " · doğrulanmış" : ""} · {job.citySlug}
      </p>
      <div className="mt-6 max-w-none whitespace-pre-wrap">{job.description}</div>
    </article>
  );
}
