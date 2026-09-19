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
  q: z.string().trim().max(200).refine(val => !val || /^[a-zA-Z0-9\sğüşıöçĞÜŞİÖÇ\s]*$/.test(val), "Invalid characters in search query").optional(),
  locale: localeSchema.default("tr"),
  city: z.string().trim().max(80).refine(val => !val || /^[a-z0-9-]+$/.test(val), "Invalid city slug format").optional(),
  category: z.string().trim().max(80).refine(val => !val || /^[a-z0-9-]+$/.test(val), "Invalid category slug format").optional(),
  remote: z.enum(["remote", "hybrid", "onsite"]).optional(),
  employment: z.enum(EMPLOYMENT_TYPES).optional(),
  experience: z.enum(EXPERIENCE_LEVELS).optional(),
  salaryMin: z.coerce.number().nonnegative().max(1000000, "Salary exceeds maximum limit").optional(),
  salaryMax: z.coerce.number().nonnegative().max(1000000, "Salary exceeds maximum limit").optional(),
  cursor: z.string().min(8).max(256).optional(),
  page: z.coerce.number().int().positive().max(500).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
}).refine(data => {
  if (data.salaryMin && data.salaryMax && data.salaryMin > data.salaryMax) {
    return false;
  }
  return true;
}, "Minimum salary cannot exceed maximum salary");

export type JobSearchQuery = z.infer<typeof jobSearchSchema>;

export const jobWriteSchema = z.object({
  organizationId: z.string().uuid(),
  categorySlug: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/, "Invalid category slug format"),
  citySlug: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/, "Invalid city slug format"),
  remoteType: z.enum(["remote", "hybrid", "onsite"]),
  employmentType: z.enum(EMPLOYMENT_TYPES),
  experienceLevel: z.enum(EXPERIENCE_LEVELS).optional(),
  salaryMin: z.number().nonnegative().max(1000000).optional(),
  salaryMax: z.number().nonnegative().max(1000000).optional(),
  salaryCurrency: z.string().length(3).regex(/^[A-Z]{3}$/, "Invalid currency code").default("TRY"),
  sourceLocale: localeSchema,
  title: z.string().min(3).max(160).regex(/^[a-zA-Z0-9\sğüşıöçĞÜŞİÖÇ!?.,()-]+$/, "Invalid characters in title"),
  description: z.string().min(40).max(20000),
  slug: z.string().min(3).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format"),
  skillSlugs: z.array(z.string().regex(/^[a-z0-9-]+$/, "Invalid skill slug format")).max(30).default([]),
  attributes: z
    .array(z.object({ 
      code: z.string().min(1).max(50),
      value: z.string().max(120) 
    }))
    .max(20)
    .default([]),
}).refine(data => {
  if (data.salaryMin && data.salaryMax && data.salaryMin > data.salaryMax) {
    return false;
  }
  return true;
}, "Minimum salary cannot exceed maximum salary");

export const applicationCreateSchema = z.object({
  jobId: z.string().uuid(),
  coverNote: z.string().max(4000).regex(/^[a-zA-Z0-9\sğüşıöçĞÜŞİÖÇ!?.,;:\n\r-]+$/, "Invalid characters in cover note").optional(),
  cvUploadId: z.string().uuid().optional(),
});

export const applicationStatusSchema = z.enum(APPLICATION_STATUSES);

export const cvConfirmSchema = z.object({
  cvUploadId: z.string().uuid(),
  headline: z.string().max(160).regex(/^[a-zA-Z0-9\sğüşıöçĞÜŞİÖÇ!?.,-]+$/, "Invalid characters in headline").optional(),
  summary: z.string().max(4000).regex(/^[a-zA-Z0-9\sğüşıöçĞÜŞİÖÇ!?.,;:\n\r-]+$/, "Invalid characters in summary").optional(),
  citySlug: z.string().optional().refine(val => !val || /^[a-z0-9-]+$/.test(val), "Invalid city slug format"),
  remotePref: z.enum(REMOTE_TYPES).default("any"),
  experiences: z.array(
    z.object({
      title: z.string().min(1).max(160).regex(/^[a-zA-Z0-9\sğüşıöçĞÜŞİÖÇ!?.,-]+$/, "Invalid characters in title"),
      company: z.string().min(1).max(160).regex(/^[a-zA-Z0-9\sğüşıöçĞÜŞİÖÇ!?.,-]+$/, "Invalid characters in company"),
      startDate: z.string().optional().refine(val => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), "Invalid date format (YYYY-MM-DD)"),
      endDate: z.string().optional().refine(val => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), "Invalid date format (YYYY-MM-DD)"),
      isCurrent: z.boolean().default(false),
      description: z.string().max(2000).regex(/^[a-zA-Z0-9\sğüşıöçĞÜŞİÖÇ!?.,;:\n\r-]+$/, "Invalid characters in description").optional(),
    }),
  ).max(20, "Too many experiences (max 20)"),
  educations: z.array(
    z.object({
      school: z.string().min(1).max(160).regex(/^[a-zA-Z0-9\sğüşıöçĞÜŞİÖÇ!?.,-]+$/, "Invalid characters in school"),
      degree: z.string().max(100).regex(/^[a-zA-Z0-9\sğüşıöçĞÜŞİÖÇ!?.,-]+$/, "Invalid characters in degree").optional(),
      field: z.string().max(100).regex(/^[a-zA-Z0-9\sğüşıöçĞÜŞİÖÇ!?.,-]+$/, "Invalid characters in field").optional(),
      startDate: z.string().optional().refine(val => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), "Invalid date format (YYYY-MM-DD)"),
      endDate: z.string().optional().refine(val => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), "Invalid date format (YYYY-MM-DD)"),
    }),
  ).max(10, "Too many educations (max 10)"),
  skills: z.array(
    z.object({
      slug: z.string().regex(/^[a-z0-9-]+$/, "Invalid skill slug format"),
      proficiency: z.enum(SKILL_PROFICIENCIES).optional(),
    }),
  ).max(50, "Too many skills (max 50)"),
}).refine(data => {
  // Validate date ranges in experiences
  for (const exp of data.experiences) {
    if (exp.startDate && exp.endDate && new Date(exp.startDate) > new Date(exp.endDate)) {
      return false;
    }
  }
  // Validate date ranges in educations
  for (const edu of data.educations) {
    if (edu.startDate && edu.endDate && new Date(edu.startDate) > new Date(edu.endDate)) {
      return false;
    }
  }
  return true;
}, "Invalid date ranges (start date cannot be after end date)");

export const verificationDecideSchema = z.object({
  documentId: z.string().uuid(),
  decision: z.enum(["verified", "rejected"]),
  note: z.string().max(2000).regex(/^[a-zA-Z0-9\sğüşıöçĞÜŞİÖÇ!?.,;:\n\r-]+$/, "Invalid characters in note").optional(),
});

export const jobStatusSchema = z.enum(JOB_STATUSES);
export const cvStatusSchema = z.enum(CV_STATUSES);
