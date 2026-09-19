import type { SupabaseClient } from "@supabase/supabase-js";
import { createAuditRepository } from "./audit.repository";
import { createApplicationRepository } from "./applications.repository";
import { createCandidateRepository } from "./candidates.repository";
import { createCatalogRepository } from "./catalog.repository";
import { createJobRepository } from "./jobs.repository";
import { createLookupRepository } from "./lookup.repository";
import { createOrganizationRepository } from "./organizations.repository";
import { createOutboxRepository } from "./outbox.repository";
import { createVerificationRepository } from "./verification.repository";

export type UserDb = SupabaseClient;
export type ServiceDb = SupabaseClient;

export function createRepositories(user: UserDb, service?: ServiceDb) {
  const privileged = service ?? user;
  return {
    catalog: createCatalogRepository(user),
    jobs: createJobRepository(user),
    applications: createApplicationRepository(user),
    candidates: createCandidateRepository(user),
    organizations: createOrganizationRepository(user),
    lookup: createLookupRepository(user),
    verification: createVerificationRepository(privileged),
    outbox: createOutboxRepository(privileged),
    audit: createAuditRepository(privileged),
  };
}

export type Repositories = ReturnType<typeof createRepositories>;
