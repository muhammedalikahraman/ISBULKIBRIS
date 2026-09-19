export const CODED_KINDS = [
  "system_role",
  "org_member_role",
  "remote_type",
  "employment_type",
  "experience_level",
  "job_status",
  "translation_status",
  "application_status",
  "badge_type",
  "badge_status",
  "document_type",
  "document_status",
  "cv_status",
  "outbox_status",
  "content_source",
  "skill_proficiency",
  "job_attribute",
] as const;

export type CodedKind = (typeof CODED_KINDS)[number];

export const SYSTEM_ROLES = ["candidate", "employer", "admin"] as const;
export const ORG_MEMBER_ROLES = ["owner", "recruiter", "viewer"] as const;
export const REMOTE_TYPES = ["remote", "hybrid", "onsite", "any"] as const;
export const EMPLOYMENT_TYPES = [
  "FULL_TIME",
  "PART_TIME",
  "CONTRACTOR",
  "INTERN",
  "TEMPORARY",
] as const;
export const EXPERIENCE_LEVELS = ["entry", "mid", "senior", "lead"] as const;
export const JOB_STATUSES = ["draft", "active", "expired", "removed"] as const;
export const TRANSLATION_STATUSES = ["draft", "published"] as const;
export const APPLICATION_STATUSES = [
  "submitted",
  "viewed",
  "shortlisted",
  "rejected",
  "hired",
] as const;
export const BADGE_TYPES = ["email", "phone", "company", "identity"] as const;
export const BADGE_STATUSES = ["pending", "verified", "rejected"] as const;
export const DOCUMENT_TYPES = ["identity", "tax_certificate", "other"] as const;
export const DOCUMENT_STATUSES = ["pending", "verified", "rejected"] as const;
export const CV_STATUSES = ["processing", "ready", "failed"] as const;
export const OUTBOX_STATUSES = ["pending", "processing", "published", "failed"] as const;
export const CONTENT_SOURCES = ["manual", "ai_extracted"] as const;
export const SKILL_PROFICIENCIES = [
  "beginner",
  "intermediate",
  "advanced",
  "expert",
] as const;

export const PRODUCT_SETTING_KEYS = {
  jobDefaultExpiryDays: "jobs.default_expiry_days",
  cvParseDailyQuota: "cv.parse.daily_quota",
  facetRefreshMinutes: "search.facet_refresh_minutes",
  applicationDailyCap: "applications.daily_cap_per_user",
} as const;
