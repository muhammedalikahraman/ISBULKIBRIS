import type { SupabaseClient } from "@supabase/supabase-js";
import type { LocaleCode } from "../../kernel/locale";
import type { CatalogRepository } from "../ports";
import { throwIfError } from "../errors";

type Translation = { name: string };
type TranslationArray = Translation[];
type Named = { slug: string; translations: TranslationArray | Translation | null };

function nameOf(row: Named): string {
  const t = row.translations;
  if (Array.isArray(t) && t.length > 0) return t[0].name;
  if (t && 'name' in t) return t.name;
  return row.slug;
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
      
      const rows = (data ?? []) as any[];
      return rows.map((row) => ({
        slug: row.slug,
        name: nameOf({ slug: row.slug, translations: row.city_translations }),
        region: row.regions 
          ? nameOf({ 
              slug: row.regions.slug, 
              translations: row.regions.region_translations 
            })
          : null,
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
      
      const rows = (data ?? []) as any[];
      return rows.map((row) => ({
        slug: row.slug,
        name: nameOf({ slug: row.slug, translations: row.category_translations }),
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
      
      const rows = (data ?? []) as any[];
      return rows.map((row) => ({
        slug: row.slug,
        name: nameOf({ slug: row.slug, translations: row.skill_translations }),
      }));
    },

    async facetCounts(locale: LocaleCode) {
      const { data, error } = await db
        .from("job_facet_counts")
        .select("city_id, category_id, job_count")
        .eq("locale", locale);
      throwIfError(error);

      const rows = (data ?? []) as any[];
      const cityIds = [...new Set(rows.map((r) => r.city_id))];
      const categoryIds = [...new Set(rows.map((r) => r.category_id))];

      const [{ data: cities }, { data: categories }] = await Promise.all([
        db.from("cities").select("id, slug").in("id", cityIds.length ? cityIds : [-1]),
        db.from("categories").select("id, slug").in("id", categoryIds.length ? categoryIds : [-1]),
      ]);

      const citySlug = new Map((cities ?? []).map((c) => [c.id, c.slug]));
      const categorySlug = new Map((categories ?? []).map((c) => [c.id, c.slug]));

      const byCityMap = new Map<string, number>();
      const byCategoryMap = new Map<string, number>();
      
      for (const row of rows) {
        const cs = citySlug.get(row.city_id);
        const ks = categorySlug.get(row.category_id);
        if (cs) byCityMap.set(cs, (byCityMap.get(cs) ?? 0) + row.job_count);
        if (ks) byCategoryMap.set(ks, (byCategoryMap.get(ks) ?? 0) + row.job_count);
      }

      return {
        byCity: [...byCityMap.entries()].map(([slug, count]) => ({ slug, count })),
        byCategory: [...byCategoryMap.entries()].map(([slug, count]) => ({ slug, count })),
      };
    },
  };
}
