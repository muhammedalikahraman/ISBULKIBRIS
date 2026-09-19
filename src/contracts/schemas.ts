import { z } from "zod";
import { LOCALES } from "../kernel/locale";
import {
  APPLICATION_STATUSES,
  CV_STATUSES,
  EMPLOYMENT_TYPES,
  EXPERIENCE_LEVELS,
  JOB_STATUSES,
  REMOTE_TYPES,
  SKILL_PROFICIENCIES,
} from "../kernel/catalog-codes";

export const localeSchema = z.enum(LOCALES);

export const jobSearchSchema = z.object({
  q: z.string().trim().max(200).optional(),
  locale: localeSchema.default("tr"),
  city: z.string().trim().max(80).optional(),
  category: z.string().trim().max(80).optional(),
  remote: z.enum(["remote", "hybrid", "onsite"]).optional(),
  employment: z.enum(EMPLOYMENT_TYPES).optional(),
  experience: z.enum(EXPERIENCE_LEVELS).optional(),
  salaryMin: z.coerce.number().nonnegative().optional(),
  salaryMax: z.coerce.number().nonnegative().optional(),
  cursor: z.string().min(8).max(256).optional(),
  page: z.coerce.number().int().positive().max(500).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type JobSearchQuery = z.infer<typeof jobSearchSchema>;

export const jobWriteSchema = z.object({
  organizationId: z.string().uuid(),
  categorySlug: z.string().min(1),
  citySlug: z.string().min(1),
  remoteType: z.enum(["remote", "hybrid", "onsite"]),
  employmentType: z.enum(EMPLOYMENT_TYPES),
  experienceLevel: z.enum(EXPERIENCE_LEVELS).optional(),
  salaryMin: z.number().nonnegative().optional(),
  salaryMax: z.number().nonnegative().optional(),
  salaryCurrency: z.string().length(3).default("TRY"),
  sourceLocale: localeSchema,
  title: z.string().min(3).max(160),
  description: z.string().min(40).max(20000),
  slug: z.string().min(3).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  skillSlugs: z.array(z.string()).max(30).default([]),
  attributes: z
    .array(z.object({ code: z.string(), value: z.string().max(120) }))
    .max(20)
    .default([]),
});

export const applicationCreateSchema = z.object({
  jobId: z.string().uuid(),
  coverNote: z.string().max(4000).optional(),
  cvUploadId: z.string().uuid().optional(),
});

export const applicationStatusSchema = z.enum(APPLICATION_STATUSES);

export const cvConfirmSchema = z.object({
  cvUploadId: z.string().uuid(),
  headline: z.string().max(160).optional(),
  summary: z.string().max(4000).optional(),
  citySlug: z.string().optional(),
  remotePref: z.enum(REMOTE_TYPES).default("any"),
  experiences: z.array(
    z.object({
      title: z.string().min(1),
      company: z.string().min(1),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      isCurrent: z.boolean().default(false),
      description: z.string().optional(),
    }),
  ),
  educations: z.array(
    z.object({
      school: z.string().min(1),
      degree: z.string().optional(),
      field: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }),
  ),
  skills: z.array(
    z.object({
      slug: z.string(),
      proficiency: z.enum(SKILL_PROFICIENCIES).optional(),
    }),
  ),
});

export const verificationDecideSchema = z.object({
  documentId: z.string().uuid(),
  decision: z.enum(["verified", "rejected"]),
  note: z.string().max(2000).optional(),
});

export const jobStatusSchema = z.enum(JOB_STATUSES);
export const cvStatusSchema = z.enum(CV_STATUSES);
