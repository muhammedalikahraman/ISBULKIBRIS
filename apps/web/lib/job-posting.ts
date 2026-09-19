import type { JobDetail } from "@isbulkibris/data";

export function jobPostingJsonLd(job: JobDetail, locale: string, url: string) {
  const posted = job.publishedAt ?? undefined;
  const salary =
    job.salaryMin != null || job.salaryMax != null
      ? {
          "@type": "MonetaryAmount",
          currency: job.salaryCurrency,
          value: {
            "@type": "QuantitativeValue",
            minValue: job.salaryMin ?? undefined,
            maxValue: job.salaryMax ?? undefined,
            unitText: "MONTH",
          },
        }
      : undefined;

  return {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    identifier: {
      "@type": "PropertyValue",
      name: "IsBulKibris",
      value: job.id,
    },
    datePosted: posted,
    validThrough: job.expiresAt ?? undefined,
    employmentType: job.employmentType,
    hiringOrganization: {
      "@type": "Organization",
      name: job.organizationName,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.citySlug,
        addressCountry: "CY",
      },
    },
    jobLocationType: job.remoteType === "remote" ? "TELECOMMUTE" : undefined,
    applicantLocationRequirements:
      job.remoteType === "remote"
        ? { "@type": "Country", name: "CY" }
        : undefined,
    baseSalary: salary,
    directApply: true,
    url,
    inLanguage: locale,
  };
}
