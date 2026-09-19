import type { SupabaseClient } from "@supabase/supabase-js";
import { decodeCursor, encodeCursor } from "../../kernel/pagination";
import type { LocaleCode } from "../../kernel/locale";
import type { JobSearchQuery } from "../../contracts/schemas";
import type { JobDetail, JobListItem, JobRepository, PageResult } from "../ports";
import { throwIfError } from "../errors";

type SearchRow = {
  id: string;
  slug: string;
  locale: LocaleCode;
  title: string;
  city_slug: string;
  category_slug: string;
  remote_type: JobListItem["remoteType"];
  employment_type: string;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  published_at: string | null;
  organization_name: string;
  verified_organization: boolean;
};

function toListItem(row: SearchRow): JobListItem {
  return {
    id: row.id,
    slug: row.slug,
    locale: row.locale,
    title: row.title,
    citySlug: row.city_slug,
    categorySlug: row.category_slug,
    remoteType: row.remote_type,
    employmentType: row.employment_type,
    salaryMin: row.salary_min,
    salaryMax: row.salary_max,
    salaryCurrency: row.salary_currency,
    publishedAt: row.published_at,
    organizationName: row.organization_name,
    verifiedOrganization: row.verified_organization,
  };
}

export function createJobRepository(db: SupabaseClient): JobRepository {
  return {
    async search(query: JobSearchQuery): Promise<PageResult<JobListItem>> {
      const cursor = query.cursor ? decodeCursor(query.cursor) : null;
      const limit = query.limit ?? 20;
      const { data, error } = await db.rpc("search_jobs", {
        p_locale: query.locale,
        p_q: query.q ?? null,
        p_city: query.city ?? null,
        p_category: query.category ?? null,
        p_remote: query.remote ?? null,
        p_employment: query.employment ?? null,
        p_experience: query.experience ?? null,
        p_salary_min: query.salaryMin ?? null,
        p_salary_max: query.salaryMax ?? null,
        p_cursor_published: cursor?.publishedAt ?? null,
        p_cursor_id: cursor?.id ?? null,
        p_limit: limit + 1,
      });
      throwIfError(error);
      const rows = (data ?? []) as SearchRow[];
      const hasMore = rows.length > limit;
      const page = hasMore ? rows.slice(0, limit) : rows;
      const last = page[page.length - 1];
      return {
        items: page.map(toListItem),
        nextCursor:
          hasMore && last?.published_at
            ? encodeCursor({ publishedAt: last.published_at, id: last.id })
            : null,
      };
    },

    async getBySlug(locale: LocaleCode, slug: string): Promise<JobDetail | null> {
      const { data, error } = await db.rpc("get_published_job", {
        p_locale: locale,
        p_slug: slug,
      });
      throwIfError(error);
      const row = (data as (SearchRow & { description: string; expires_at: string | null; organization_id: string })[] | null)?.[0];
      if (!row) return null;
      return {
        ...toListItem(row),
        description: row.description,
        expiresAt: row.expires_at,
        organizationId: row.organization_id,
      };
    },

    async listByOrganization(organizationId: string, locale: LocaleCode): Promise<JobListItem[]> {
      const { data, error } = await db
        .from("jobs")
        .select(
          "id, remote_type, employment_type, salary_min, salary_max, salary_currency, published_at, organizations(legal_name, verified), cities(slug), categories(slug), job_translations!inner(slug, title, locale)",
        )
        .eq("organization_id", organizationId)
        .eq("job_translations.locale", locale)
        .order("created_at", { ascending: false });
      throwIfError(error);
      return (data ?? []).map((row) => {
        const tr = Array.isArray(row.job_translations) ? row.job_translations[0] : row.job_translations;
        const org = Array.isArray(row.organizations) ? row.organizations[0] : row.organizations;
        const city = Array.isArray(row.cities) ? row.cities[0] : row.cities;
        const cat = Array.isArray(row.categories) ? row.categories[0] : row.categories;
        return {
          id: row.id as string,
          slug: (tr as { slug: string }).slug,
          locale,
          title: (tr as { title: string }).title,
          citySlug: (city as { slug: string }).slug,
          categorySlug: (cat as { slug: string }).slug,
          remoteType: row.remote_type as JobListItem["remoteType"],
          employmentType: row.employment_type as string,
          salaryMin: (row.salary_min as number | null) ?? null,
          salaryMax: (row.salary_max as number | null) ?? null,
          salaryCurrency: row.salary_currency as string,
          publishedAt: (row.published_at as string | null) ?? null,
          organizationName: (org as { legal_name: string }).legal_name,
          verifiedOrganization: Boolean((org as { verified: boolean }).verified),
        };
      });
    },

    async createDraft(input) {
      const { data: job, error } = await db
        .from("jobs")
        .insert({
          organization_id: input.organizationId,
          category_id: input.categoryId,
          city_id: input.cityId,
          remote_type: input.remoteType,
          employment_type: input.employmentType,
          experience_level: input.experienceLevel ?? null,
          salary_min: input.salaryMin ?? null,
          salary_max: input.salaryMax ?? null,
          salary_currency: input.salaryCurrency,
          source_locale: input.sourceLocale,
          status: "draft",
        })
        .select("id")
        .single();
      throwIfError(error);
      const jobId = job!.id as string;

      const { error: trErr } = await db.from("job_translations").insert({
        job_id: jobId,
        locale: input.sourceLocale,
        title: input.title,
        description: input.description,
        slug: input.slug,
        status: "draft",
        is_machine_draft: false,
      });
      throwIfError(trErr);

      if (input.skillIds.length) {
        const { error: skErr } = await db.from("job_skills").insert(
          input.skillIds.map((skill_id) => ({ job_id: jobId, skill_id })),
        );
        throwIfError(skErr);
      }

      const { error: outErr } = await db.rpc("enqueue_outbox", {
        p_event_type: "job.translation.requested",
        p_aggregate_type: "job",
        p_aggregate_id: jobId,
        p_payload: { sourceLocale: input.sourceLocale },
      });
      throwIfError(outErr);

      return { id: jobId };
    },

    async publish(jobId: string, locale: LocaleCode) {
      const { error: trErr } = await db
        .from("job_translations")
        .update({ status: "published" })
        .eq("job_id", jobId)
        .eq("locale", locale);
      throwIfError(trErr);

      const { error } = await db
        .from("jobs")
        .update({
          status: "active",
          published_at: new Date().toISOString(),
        })
        .eq("id", jobId)
        .eq("status", "draft");
      throwIfError(error);
    },
  };
}
