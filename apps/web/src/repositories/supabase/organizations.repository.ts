import type { SupabaseClient } from "@supabase/supabase-js";
import type { OrganizationRecord, OrganizationRepository } from "../ports";
import { throwIfError, requireRow } from "../errors";

type OrganizationRow = {
  id: string;
  slug: string;
  legal_name: string;
  website: string | null;
  verified: boolean;
  logo_path: string | null;
};

type MemberRow = {
  user_id: string;
  role_code: string;
};

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
      
      const row = data as OrganizationRow;
      return {
        id: row.id,
        slug: row.slug,
        legalName: row.legal_name,
        website: row.website,
        verified: row.verified,
        logoPath: row.logo_path,
      };
    },

    async listMembers(id: string) {
      const { data, error } = await db
        .from("organization_members")
        .select("user_id, role_code")
        .eq("organization_id", id);
      throwIfError(error);
      
      const rows = (data ?? []) as MemberRow[];
      return rows.map((m) => ({ 
        userId: m.user_id, 
        role: m.role_code 
      }));
    },

    async createWithOwner(input) {
      const { data, error } = await db.rpc("create_organization_with_owner", {
        p_slug: input.slug,
        p_legal_name: input.legalName,
        p_website: input.website ?? null,
        p_city_id: input.cityId ?? null,
      });
      throwIfError(error);
      
      const id = requireRow(data as string | null, error);
      return { id };
    },
  };
}
