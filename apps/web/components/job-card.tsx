import { Link } from "@/i18n/navigation";
import {
  MapPinIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  ClockIcon,
  BuildingIcon,
  WifiIcon,
  MonitorIcon,
  DollarSignIcon,
  ArrowRightIcon,
} from "@/components/icons";
import type { JobListItem } from "@isbulkibris/data";

type Props = {
  job: JobListItem;
  cityName?: string;
  categoryName?: string;
  locale: string;
};

const REMOTE_LABELS: Record<string, { tr: string; en: string; ru: string; he: string }> = {
  remote: { tr: "Uzaktan", en: "Remote", ru: "Удаленно", he: "מרחוק" },
  hybrid: { tr: "Hibrit", en: "Hybrid", ru: "Гибрид", he: "היברידי" },
  onsite: { tr: "Ofiste", en: "On-site", ru: "В офисе", he: "במשרד" },
};

const EMPLOYMENT_LABELS: Record<string, { tr: string; en: string; ru: string; he: string }> = {
  FULL_TIME: { tr: "Tam Zamanlı", en: "Full-time", ru: "Полная", he: "מלא" },
  PART_TIME: { tr: "Yarı Zamanlı", en: "Part-time", ru: "Частичная", he: "חלקי" },
  CONTRACTOR: { tr: "Sözleşmeli", en: "Contract", ru: "Контракт", he: "חוזה" },
  INTERN: { tr: "Stajyer", en: "Intern", ru: "Стажер", he: "מתמחה" },
  TEMPORARY: { tr: "Geçici", en: "Temporary", ru: "Временно", he: "זמני" },
};

function timeAgo(dateStr: string | null, locale: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  const labels = {
    tr: { today: "Bugün", days: "gün önce", week: "hafta önce", month: "ay önce" },
    en: { today: "Today", days: "days ago", week: "weeks ago", month: "months ago" },
    ru: { today: "Сегодня", days: "дн. назад", week: "нед. назад", month: "мес. назад" },
    he: { today: "היום", days: "ימים", week: "שבועות", month: "חודשים" },
  };
  const l = labels[locale as keyof typeof labels] ?? labels.tr;
  if (days <= 0) return l.today;
  if (days === 1) return locale === "tr" ? "Dün" : locale === "ru" ? "Вчера" : locale === "he" ? "אתמול" : "Yesterday";
  if (days < 7) return `${days} ${l.days}`;
  if (days < 30) return `${Math.floor(days / 7)} ${l.week}`;
  return `${Math.floor(days / 30)} ${l.month}`;
}

function formatSalary(min: number | null, max: number | null, currency: string): string | null {
  if (!min && !max) return null;
  const fmt = (n: number) => n.toLocaleString("tr-TR");
  if (min && max) return `${fmt(min)} - ${fmt(max)} ${currency}`;
  if (min) return `${fmt(min)}+ ${currency}`;
  return `≤ ${fmt(max!)} ${currency}`;
}

function RemoteIcon({ type }: { type: string }) {
  if (type === "remote") return <WifiIcon className="h-4 w-4" />;
  if (type === "hybrid") return <MonitorIcon className="h-4 w-4" />;
  return <BuildingIcon className="h-4 w-4" />;
}

export function JobCard({ job, cityName, categoryName, locale }: Props) {
  const remoteLabel = REMOTE_LABELS[job.remoteType]?.[locale as keyof typeof REMOTE_LABELS[job.remoteType]] ?? job.remoteType;
  const employmentLabel = EMPLOYMENT_LABELS[job.employmentType]?.[locale as keyof typeof EMPLOYMENT_LABELS[job.employmentType]] ?? job.employmentType;
  const salary = formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency);
  const posted = timeAgo(job.publishedAt, locale);
  const initials = job.organizationName.slice(0, 2).toUpperCase();

  return (
    <Link
      href={`/ilan/${job.slug}`}
      className="card-lift group block overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 hover:border-primary-300 sm:p-6"
    >
      <div className="flex items-start gap-4">
        {/* Org avatar */}
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 text-sm font-bold text-primary-700">
          {initials}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-gray-900 group-hover:text-primary-700 sm:text-lg">
                {job.title}
              </h3>
              <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                <span className="truncate font-medium text-gray-600">{job.organizationName}</span>
                {job.verifiedOrganization && (
                  <span className="flex items-center gap-1 rounded-full bg-success-50 px-2 py-0.5 text-xs font-medium text-success-700">
                    <CheckCircleIcon className="h-3 w-3" />
                    {locale === "tr" ? "Doğrulanmış" : locale === "ru" ? "Проверен" : locale === "he" ? "מאומת" : "Verified"}
                  </span>
                )}
              </div>
            </div>
            <ArrowRightIcon className="h-5 w-5 flex-shrink-0 text-gray-300 transition-all group-hover:translate-x-1 group-hover:text-primary-500" />
          </div>

          {/* Tags */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600">
              <MapPinIcon className="h-3.5 w-3.5 text-primary-500" />
              {cityName ?? job.citySlug}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600">
              <RemoteIcon type={job.remoteType} />
              {remoteLabel}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600">
              <BriefcaseIcon className="h-3.5 w-3.5 text-primary-500" />
              {employmentLabel}
            </span>
            {categoryName && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">
                {categoryName}
              </span>
            )}
            {salary && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-accent-50 px-2.5 py-1 text-xs font-semibold text-accent-700">
                <DollarSignIcon className="h-3.5 w-3.5" />
                {salary}
              </span>
            )}
          </div>

          {/* Footer */}
          {posted && (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
              <ClockIcon className="h-3.5 w-3.5" />
              {posted}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
