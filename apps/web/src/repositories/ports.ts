import type { LocaleCode } from "../kernel/locale";
import type { JobSearchQuery } from "../contracts/schemas";
import type { z } from "zod";
import type { cvConfirmSchema } from "../contracts/schemas";

export type JobListItem = {
  id: string;
  slug: string;
  locale: LocaleCode;
  title: string;
  citySlug: string;
  categorySlug: string;
  remoteType: "remote" | "hybrid" | "onsite";
  employmentType: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  publishedAt: string | null;
  organizationName: string;
  verifiedOrganization: boolean;
};

export type JobDetail = JobListItem & {
  description: string;
  expiresAt: string | null;
  organizationId: string;
};

export type PageResult<T> = {
  items: T[];
  nextCursor: string | null;
  totalHint?: number;
};

export type CandidateProfile = {
  userId: string;
  headline: string | null;
  summary: string | null;
  citySlug: string | null;
  remotePref: string;
  avatarPath: string | null;
  experiences: {
    id: string;
    title: string;
    company: string;
    startDate: string | null;
    endDate: string | null;
    isCurrent: boolean;
    description: string | null;
    source: string;
  }[];
  educations: {
    id: string;
    school: string;
    degree: string | null;
    field: string | null;
    startDate: string | null;
    endDate: string | null;
    source: string;
  }[];
  skills: { slug: string; proficiency: string | null }[];
};

export type OrganizationRecord = {
  id: string;
  slug: string;
  legalName: string;
  website: string | null;
  verified: boolean;
  logoPath: string | null;
};

export interface CatalogRepository {
  listCities(locale: LocaleCode): Promise<{ slug: string; name: string; region: string | null }[]>;
  listCategories(locale: LocaleCode): Promise<{ slug: string; name: string }[]>;
  listSkills(locale: LocaleCode): Promise<{ slug: string; name: string }[]>;
  facetCounts(locale: LocaleCode): Promise<{
    byCity: { slug: string; count: number }[];
    byCategory: { slug: string; count: number }[];
  }>;
}

export interface JobRepository {
  search(query: JobSearchQuery): Promise<PageResult<JobListItem>>;
  getBySlug(locale: LocaleCode, slug: string): Promise<JobDetail | null>;
  listByOrganization(organizationId: string, locale: LocaleCode): Promise<JobListItem[]>;
  createDraft(input: {
    organizationId: string;
    categoryId: number;
    cityId: number;
    remoteType: "remote" | "hybrid" | "onsite";
    employmentType: string;
    experienceLevel?: string;
    salaryMin?: number;
    salaryMax?: number;
    salaryCurrency: string;
    sourceLocale: LocaleCode;
    title: string;
    description: string;
    slug: string;
    skillIds: number[];
  }): Promise<{ id: string }>;
  publish(jobId: string, locale: LocaleCode): Promise<void>;
}

export interface ApplicationRepository {
  submit(input: {
    jobId: string;
    candidateId: string;
    coverNote?: string;
    cvUploadId?: string;
  }): Promise<{ id: string }>;
  updateStatus(input: { id: string; status: string }): Promise<void>;
}

export interface CandidateRepository {
  getProfile(userId: string): Promise<CandidateProfile | null>;
  replaceFromConfirmedCv(
    userId: string,
    payload: z.infer<typeof cvConfirmSchema>,
  ): Promise<void>;
}

export interface OrganizationRepository {
  getById(id: string): Promise<OrganizationRecord | null>;
  listMembers(id: string): Promise<{ userId: string; role: string }[]>;
  createWithOwner(input: {
    slug: string;
    legalName: string;
    website?: string;
    cityId?: number;
  }): Promise<{ id: string }>;
}

export interface VerificationRepository {
  enqueueDocument(input: {
    userId: string;
    type: string;
    storagePath: string;
    organizationId?: string;
  }): Promise<{ id: string }>;
  decide(input: {
    documentId: string;
    actorId: string;
    decision: "verified" | "rejected";
    note?: string;
  }): Promise<void>;
}

export interface OutboxRepository {
  enqueue(event: {
    type: string;
    aggregateType: string;
    aggregateId: string;
    payload: unknown;
  }): Promise<void>;
  claimBatch(limit: number): Promise<{ id: string; type: string; payload: unknown }[]>;
  markPublished(id: string): Promise<void>;
  markFailed(id: string, error: string): Promise<void>;
}

export interface AuditRepository {
  append(entry: {
    actorId: string | null;
    action: string;
    entityType: string;
    entityId?: string;
    meta?: unknown;
  }): Promise<void>;
}

export interface LookupRepository {
  cityIdBySlug(slug: string): Promise<number | null>;
  categoryIdBySlug(slug: string): Promise<number | null>;
  skillIdsBySlugs(slugs: string[]): Promise<number[]>;
}
