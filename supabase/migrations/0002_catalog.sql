-- 0002 catalog: bölge, şehir, kategori, beceri + çeviri satırları
create table public.regions (
  id serial primary key,
  slug text unique not null
);
alter table public.regions enable row level security;
create policy "anyone_reads_regions" on public.regions for select to anon, authenticated using (true);

create table public.region_translations (
  region_id int not null references public.regions(id) on delete cascade,
  locale text not null references public.locales(code),
  name text not null,
  primary key (region_id, locale)
);
alter table public.region_translations enable row level security;
create policy "anyone_reads_region_tr" on public.region_translations for select to anon, authenticated using (true);

create table public.cities (
  id serial primary key,
  slug text unique not null,
  region_id int references public.regions(id),
  is_active boolean not null default true,
  sort_order int not null default 0
);
alter table public.cities enable row level security;
create policy "anyone_reads_cities" on public.cities for select to anon, authenticated using (is_active = true);

create table public.city_translations (
  city_id int not null references public.cities(id) on delete cascade,
  locale text not null references public.locales(code),
  name text not null,
  primary key (city_id, locale)
);
alter table public.city_translations enable row level security;
create policy "anyone_reads_city_tr" on public.city_translations for select to anon, authenticated using (true);

create table public.categories (
  id serial primary key,
  slug text unique not null,
  parent_id int references public.categories(id),
  is_active boolean not null default true,
  sort_order int not null default 0
);
alter table public.categories enable row level security;
create policy "anyone_reads_categories" on public.categories for select to anon, authenticated using (is_active = true);

create table public.category_translations (
  category_id int not null references public.categories(id) on delete cascade,
  locale text not null references public.locales(code),
  name text not null,
  primary key (category_id, locale)
);
alter table public.category_translations enable row level security;
create policy "anyone_reads_category_tr" on public.category_translations for select to anon, authenticated using (true);

create table public.skills (
  id serial primary key,
  slug text unique not null,
  is_active boolean not null default true
);
alter table public.skills enable row level security;
create policy "anyone_reads_skills" on public.skills for select to anon, authenticated using (is_active = true);

create table public.skill_translations (
  skill_id int not null references public.skills(id) on delete cascade,
  locale text not null references public.locales(code),
  name text not null,
  primary key (skill_id, locale)
);
alter table public.skill_translations enable row level security;
create policy "anyone_reads_skill_tr" on public.skill_translations for select to anon, authenticated using (true);
