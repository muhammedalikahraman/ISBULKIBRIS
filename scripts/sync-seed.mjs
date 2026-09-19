import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const seedDir = join(root, "data", "seed");

function sqlStr(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function load(name) {
  return JSON.parse(readFileSync(join(seedDir, name), "utf8"));
}

const labels = load("coded-labels.json").labels;
const citiesFile = load("cities.json");
const categoriesFile = load("categories.json");
const skillsFile = load("skills.json");

const labelRows = labels
  .map(([kind, code, locale, label]) => `  (${sqlStr(kind)},${sqlStr(code)},${sqlStr(locale)},${sqlStr(label)})`)
  .join(",\n");

const regionSlugs = citiesFile.regions.map((r) => `  (${sqlStr(r.slug)})`).join(",\n");
const regionTr = citiesFile.regions
  .flatMap((r) => Object.entries(r.names).map(([locale, name]) => `  (${sqlStr(r.slug)},${sqlStr(locale)},${sqlStr(name)})`))
  .join(",\n");

const categoryInsert = categoriesFile.categories
  .map((c, i) => `  (${sqlStr(c.slug)}, ${i + 1})`)
  .join(",\n");
const categoryTr = categoriesFile.categories
  .flatMap((c) => Object.entries(c.names).map(([locale, name]) => `  (${sqlStr(c.slug)},${sqlStr(locale)},${sqlStr(name)})`))
  .join(",\n");

const skillInsert = skillsFile.skills.map((s) => `  (${sqlStr(s.slug)})`).join(",\n");
const skillTr = skillsFile.skills
  .flatMap((s) => Object.entries(s.names).map(([locale, name]) => `  (${sqlStr(s.slug)},${sqlStr(locale)},${sqlStr(name)})`))
  .join(",\n");

const sql = `-- Üretilen dosya. Kaynak: data/seed/*.json — npm run sync-seed
-- Sahte işveren, ilan, aday YOK.

insert into public.coded_value_translations (kind, code, locale, label) values
${labelRows}
on conflict do nothing;

insert into public.regions (slug) values
${regionSlugs}
on conflict (slug) do nothing;

insert into public.region_translations (region_id, locale, name)
select r.id, v.locale, v.name
from public.regions r
join (values
${regionTr}
) as v(slug, locale, name) on v.slug = r.slug
on conflict do nothing;

insert into public.cities (slug, region_id, sort_order)
select r.slug, r.id, r.id
from public.regions r
on conflict (slug) do nothing;

insert into public.city_translations (city_id, locale, name)
select c.id, rt.locale, rt.name
from public.cities c
join public.regions r on r.slug = c.slug
join public.region_translations rt on rt.region_id = r.id
on conflict do nothing;

insert into public.categories (slug, sort_order) values
${categoryInsert}
on conflict (slug) do nothing;

insert into public.category_translations (category_id, locale, name)
select c.id, v.locale, v.name
from public.categories c
join (values
${categoryTr}
) as v(slug, locale, name) on v.slug = c.slug
on conflict do nothing;

insert into public.skills (slug) values
${skillInsert}
on conflict (slug) do nothing;

insert into public.skill_translations (skill_id, locale, name)
select s.id, v.locale, v.name
from public.skills s
join (values
${skillTr}
) as v(slug, locale, name) on v.slug = s.slug
on conflict do nothing;
`;

writeFileSync(join(root, "supabase", "seed.sql"), sql);
console.log("wrote supabase/seed.sql");
