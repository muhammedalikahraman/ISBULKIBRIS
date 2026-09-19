import type { SupabaseClient } from "@supabase/supabase-js";
import type { LookupRepository } from "../ports";
import { throwIfError } from "../errors";

export function createLookupRepository(db: SupabaseClient): LookupRepository {
  return {
    async cityIdBySlug(slug: string) {
      const { data, error } = await db.from("cities").select("id").eq("slug", slug).maybeSingle();
      throwIfError(error);
      return (data?.id as number | undefined) ?? null;
    },

    async categoryIdBySlug(slug: string) {
      const { data, error } = await db.from("categories").select("id").eq("slug", slug).maybeSingle();
      throwIfError(error);
      return (data?.id as number | undefined) ?? null;
    },

    async skillIdsBySlugs(slugs: string[]) {
      if (!slugs.length) return [];
      const { data, error } = await db.from("skills").select("id, slug").in("slug", slugs);
      throwIfError(error);
      const wanted = new Set(slugs);
      return (data ?? [])
        .filter((s) => wanted.has(s.slug as string))
        .map((s) => s.id as number);
    },
  };
}
