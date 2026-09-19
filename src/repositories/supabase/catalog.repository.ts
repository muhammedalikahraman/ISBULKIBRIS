import type { SupabaseClient } from "@supabase/supabase-js";
import type { LocaleCode } from "../../kernel/locale";
import type { CatalogRepository } from "../ports";
import { throwIfError } from "../errors";

type Named = { slug: string; translations: { name: string }[] | { name: string } | null };

function nameOf(row: Named): string {
  const t = row.translations;
  if (Array.isArray(t)) return t[0]?.name ?? row.slug;
  return t?.name ?? row.slug;
}

export function createCatalogRepository(db: SupabaseClient): CatalogRepository {
  return {
    async listCities(locale: LocaleCode) {
      const { data, error } = await db
        .from("cities")
        .select("slug, city_translations!inner(name), regions(slug, region_translations!inner(name))")
        .eq("is_active", true)
        .eq("city_translations.locale", locale)
        .eq("regions.region_translations.locale", locale)
        .order("sort_order");
      throwIfError(error);
      return (data ?? []).map((row) => ({
        slug: row.slug as string,
        name: nameOf({ slug: row.slug as string, translations: row.city_translations as Named["translations"] }),
        region: nameOf({
          slug: (row.regions as { slug?: string } | null)?.slug ?? "",
          translations: (row.regions as { region_translations?: Named["translations"] } | null)?.region_translations ?? null,
        }) || null,
      }));
    },

    async listCategories(locale: LocaleCode) {
      const { data, error } = await db
        .from("categories")
        .select("slug, category_translations!inner(name)")
        .eq("is_active", true)
        .eq("category_translations.locale", locale)
        .order("sort_order");
      throwIfError(error);
      return (data ?? []).map((row) => ({
        slug: row.slug as string,
        name: nameOf({ slug: row.slug as string, translations: row.category_translations as Named["translations"] }),
      }));
    },

    async listSkills(locale: LocaleCode) {
      const { data, error } = await db
        .from("skills")
        .select("slug, skill_translations!inner(name)")
        .eq("is_active", true)
        .eq("skill_translations.locale", locale)
        .order("slug");
      throwIfError(error);
      return (data ?? []).map((row) => ({
        slug: row.slug as string,
        name: nameOf({ slug: row.slug as string, translations: row.skill_translations as Named["translations"] }),
      }));
    },

    async facetCounts(locale: LocaleCode) {
      const { data, error } = await db
        .from("job_facet_counts")
        .select("city_id, category_id, job_count")
        .eq("locale", locale);
      throwIfError(error);

      const cityIds = [...new Set((data ?? []).map((r) => r.city_id as number))];
      const categoryIds = [...new Set((data ?? []).map((r) => r.category_id as number))];

      const [{ data: cities }, { data: categories }] = await Promise.all([
        db.from("cities").select("id, slug").in("id", cityIds.length ? cityIds : [-1]),
        db.from("categories").select("id, slug").in("id", categoryIds.length ? categoryIds : [-1]),
      ]);

      const citySlug = new Map((cities ?? []).map((c) => [c.id as number, c.slug as string]));
      const categorySlug = new Map((categories ?? []).map((c) => [c.id as number, c.slug as string]));

      const byCityMap = new Map<string, number>();
      const byCategoryMap = new Map<string, number>();
      for (const row of data ?? []) {
        const cs = citySlug.get(row.city_id as number);
        const ks = categorySlug.get(row.category_id as number);
        if (cs) byCityMap.set(cs, (byCityMap.get(cs) ?? 0) + (row.job_count as number));
        if (ks) byCategoryMap.set(ks, (byCategoryMap.get(ks) ?? 0) + (row.job_count as number));
      }

      return {
        byCity: [...byCityMap.entries()].map(([slug, count]) => ({ slug, count })),
        byCategory: [...byCategoryMap.entries()].map(([slug, count]) => ({ slug, count })),
      };
    },
  };
}
