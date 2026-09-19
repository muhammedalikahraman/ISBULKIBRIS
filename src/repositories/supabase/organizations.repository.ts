import type { SupabaseClient } from "@supabase/supabase-js";
import type { OrganizationRecord, OrganizationRepository } from "../ports";
import { throwIfError, requireRow } from "../errors";

export function createOrganizationRepository(db: SupabaseClient): OrganizationRepository {
  return {
    async getById(id: string): Promise<OrganizationRecord | null> {
      const { data, error } = await db
        .from("organizations")
        .select("id, slug, legal_name, website, verified, logo_path")
        .eq("id", id)
        .maybeSingle();
      throwIfError(error);
      if (!data) return null;
      return {
        id: data.id as string,
        slug: data.slug as string,
        legalName: data.legal_name as string,
        website: (data.website as string | null) ?? null,
        verified: Boolean(data.verified),
        logoPath: (data.logo_path as string | null) ?? null,
      };
    },

    async listMembers(id: string) {
      const { data, error } = await db
        .from("organization_members")
        .select("user_id, role_code")
        .eq("organization_id", id);
      throwIfError(error);
      return (data ?? []).map((m) => ({ userId: m.user_id as string, role: m.role_code as string }));
    },

    async createWithOwner(input) {
      const { data, error } = await db.rpc("create_organization_with_owner", {
        p_slug: input.slug,
        p_legal_name: input.legalName,
        p_website: input.website ?? null,
        p_city_id: input.cityId ?? null,
      });
      throwIfError(error);
      return { id: requireRow(data as string | null, error) };
    },
  };
}
