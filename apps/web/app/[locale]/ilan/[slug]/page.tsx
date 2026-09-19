import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import type { LocaleCode } from "@isbulkibris/data";
import { repos } from "@/lib/repos";
import { jobPostingJsonLd } from "@/lib/job-posting";
import { hreflangMap, localeUrl } from "@/lib/site";
import { Link } from "@/i18n/navigation";
import {
  MapPinIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ClockIcon,
  DollarSignIcon,
  WifiIcon,
  MonitorIcon,
  BuildingIcon,
  ShareIcon,
  BookmarkIcon,
  CalendarIcon,
} from "@/components/icons";

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
    openGraph: {
      title: job.title,
      description: job.description.slice(0, 160),
      type: "article",
    },
  };
}

const REMOTE_LABELS: Record<string, { tr: string; en: string; ru: string; he: string }> = {
  remote: { tr: "Uzaktan", en: "Remote", ru: "Удаленно", he: "מרחוק" },
  hybrid: { tr: "Hibrit", en: "Hybrid", ru: "Гибрид", he: "היברידי" },
  onsite: { tr: "Ofiste", en: "On-site", ru: "В офисе", he: "במשרד" },
};

const EMPLOYMENT_LABELS: Record<string, { tr: string; en: string; ru: string; he: string }> = {
  FULL_TIME: { tr: "Tam Zamanlı", en: "Full-time", ru: "Полная занятость", he: "משרה מלאה" },
  PART_TIME: { tr: "Yarı Zamanlı", en: "Part-time", ru: "Частичная занятость", he: "משרה חלקית" },
  CONTRACTOR: { tr: "Sözleşmeli", en: "Contract", ru: "Контракт", he: "חוזה" },
  INTERN: { tr: "Stajyer", en: "Intern", ru: "Стажёр", he: "מתמחה" },
  TEMPORARY: { tr: "Geçici", en: "Temporary", ru: "Временная", he: "זמני" },
};

function formatSalary(min: number | null, max: number | null, currency: string): string | null {
  if (!min && !max) return null;
  const fmt = (n: number) => n.toLocaleString("tr-TR");
  if (min && max) return `${fmt(min)} - ${fmt(max)} ${currency}`;
  if (min) return `${fmt(min)}+ ${currency}`;
  return `≤ ${fmt(max!)} ${currency}`;
}

function formatDate(dateStr: string | null, locale: string): string | null {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const tJobs = await getTranslations("jobs");
  const db = await repos();
  const job = await db.jobs.getBySlug(locale as LocaleCode, slug);
  if (!job) notFound();
  const url = localeUrl(locale, `/ilan/${slug}`);
  const jsonLd = jobPostingJsonLd(job, locale, url);

  const remoteLabel = REMOTE_LABELS[job.remoteType]?.[locale as keyof typeof REMOTE_LABELS[job.remoteType]] ?? job.remoteType;
  const employmentLabel = EMPLOYMENT_LABELS[job.employmentType]?.[locale as keyof typeof EMPLOYMENT_LABELS[job.employmentType]] ?? job.employmentType;
  const salary = formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency);
  const published = formatDate(job.publishedAt, locale);
  const expires = formatDate(job.expiresAt, locale);
  const initials = job.organizationName.slice(0, 2).toUpperCase();

  const RemoteIcon = job.remoteType === "remote" ? WifiIcon : job.remoteType === "hybrid" ? MonitorIcon : BuildingIcon;

  // Get city and category names
  const [cities, categories] = await Promise.all([
    db.catalog.listCities(locale as LocaleCode),
    db.catalog.listCategories(locale as LocaleCode),
  ]);
  const cityName = cities.find((c) => c.slug === job.citySlug)?.name ?? job.citySlug;
  const categoryName = categories.find((c) => c.slug === job.categorySlug)?.name ?? job.categorySlug;

  return (
    <div className="py-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm">
        <Link
          href="/ilanlar"
          className="flex items-center gap-2 text-gray-500 transition-colors hover:text-primary-700"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          {locale === "tr" ? "İlanlara Dön" : locale === "ru" ? "К вакансиям" : locale === "he" ? "חזרה למשרות" : "Back to jobs"}
        </Link>
      </nav>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            {/* Header */}
            <div className="border-b border-gray-100 p-6 sm:p-8">
              <div className="flex items-start gap-4">
                {/* Org avatar */}
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 text-lg font-bold text-primary-700">
                  {initials}
                </div>

                <div className="min-w-0 flex-1">
                  {job.verifiedOrganization && (
                    <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-success-50 px-3 py-1 text-xs font-medium text-success-700">
                      <CheckCircleIcon className="h-3.5 w-3.5" />
                      {locale === "tr" ? "Doğrulanmış İşveren" : locale === "ru" ? "Проверенный работодатель" : locale === "he" ? "מעסיק מאומת" : "Verified Employer"}
                    </span>
                  )}
                  <h1 className="font-display text-2xl font-bold text-primary-950 sm:text-3xl">
                    {job.title}
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                    <span className="font-medium">{job.organizationName}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="hidden flex-shrink-0 gap-2 sm:flex">
                  <button className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50" aria-label="Share">
                    <ShareIcon className="h-4 w-4" />
                  </button>
                  <button className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50" aria-label="Save">
                    <BookmarkIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Meta tags */}
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-700">
                  <MapPinIcon className="h-4 w-4" />
                  {cityName}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-700">
                  <RemoteIcon className="h-4 w-4" />
                  {remoteLabel}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-700">
                  <BriefcaseIcon className="h-4 w-4" />
                  {employmentLabel}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-700">
                  <BuildingIcon className="h-4 w-4" />
                  {categoryName}
                </span>
                {salary && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-accent-50 px-3 py-1.5 text-sm font-semibold text-accent-700">
                    <DollarSignIcon className="h-4 w-4" />
                    {salary}
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="p-6 sm:p-8">
              <h2 className="font-display text-lg font-bold text-gray-900 mb-4">
                {locale === "tr" ? "İlan Açıklaması" : locale === "ru" ? "Описание вакансии" : locale === "he" ? "תיאור המשרה" : "Job Description"}
              </h2>
              <div className="prose prose-gray max-w-none whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                {job.description}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-20 space-y-4">
            {/* Apply card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <h3 className="font-display text-base font-bold text-gray-900 mb-4">
                {locale === "tr" ? "Bu İlana Başvur" : locale === "ru" ? "Откликнуться" : locale === "he" ? "הגש מועמדות" : "Apply for this job"}
              </h3>
              <button className="w-full rounded-xl bg-primary-500 px-6 py-3.5 font-semibold text-white shadow-lg shadow-primary-500/20 transition-all hover:bg-primary-600 hover:shadow-xl">
                {tJobs("apply")}
              </button>
              <button className="mt-2 w-full rounded-xl border border-gray-200 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50">
                <span className="flex items-center justify-center gap-2">
                  <BookmarkIcon className="h-4 w-4" />
                  {locale === "tr" ? "Kaydet" : locale === "ru" ? "Сохранить" : locale === "he" ? "שמור" : "Save"}
                </span>
              </button>
            </div>

            {/* Job info */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <h3 className="font-display text-base font-bold text-gray-900 mb-4">
                {locale === "tr" ? "İlan Bilgileri" : locale === "ru" ? "Информация" : locale === "he" ? "פרטי משרה" : "Job Info"}
              </h3>
              <dl className="space-y-3 text-sm">
                {published && (
                  <div className="flex items-center justify-between">
                    <dt className="flex items-center gap-2 text-gray-500">
                      <CalendarIcon className="h-4 w-4" />
                      {locale === "tr" ? "Yayın Tarihi" : locale === "ru" ? "Опубликовано" : locale === "he" ? "פורסם" : "Posted"}
                    </dt>
                    <dd className="font-medium text-gray-900">{published}</dd>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-2 text-gray-500">
                    <BriefcaseIcon className="h-4 w-4" />
                    {locale === "tr" ? "Çalışma Türü" : locale === "ru" ? "Тип" : locale === "he" ? "סוג" : "Type"}
                  </dt>
                  <dd className="font-medium text-gray-900">{employmentLabel}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-2 text-gray-500">
                    <RemoteIcon className="h-4 w-4" />
                    {locale === "tr" ? "Konum" : locale === "ru" ? "Локация" : locale === "he" ? "מיקום" : "Location"}
                  </dt>
                  <dd className="font-medium text-gray-900">{remoteLabel}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-2 text-gray-500">
                    <MapPinIcon className="h-4 w-4" />
                    {locale === "tr" ? "Şehir" : locale === "ru" ? "Город" : locale === "he" ? "עיר" : "City"}
                  </dt>
                  <dd className="font-medium text-gray-900">{cityName}</dd>
                </div>
                {salary && (
                  <div className="flex items-center justify-between">
                    <dt className="flex items-center gap-2 text-gray-500">
                      <DollarSignIcon className="h-4 w-4" />
                      {locale === "tr" ? "Maaş" : locale === "ru" ? "Зарплата" : locale === "he" ? "שכר" : "Salary"}
                    </dt>
                    <dd className="font-semibold text-accent-700">{salary}</dd>
                  </div>
                )}
                {expires && (
                  <div className="flex items-center justify-between">
                    <dt className="flex items-center gap-2 text-gray-500">
                      <ClockIcon className="h-4 w-4" />
                      {locale === "tr" ? "Son Tarih" : locale === "ru" ? "Срок" : locale === "he" ? "תפוגה" : "Expires"}
                    </dt>
                    <dd className="font-medium text-gray-900">{expires}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
