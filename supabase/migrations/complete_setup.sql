-- İşBulKıbrıs - Complete Database Setup
-- Bu dosya tüm migration'ları tek seferde çalıştırmak için birleştirilmiştir
-- Sıralı çalıştırılması gerekmektedir

-- ============================================================
-- 0001: Kernel Setup
-- ============================================================

create schema if not exists private;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.uid()
returns uuid
language sql
stable
as $$
  select auth.uid();
$$;

create table public.locales (
  code text primary key,
  bcp47 text not null,
  native_name text not null,
  dir text not null check (dir in ('ltr', 'rtl')),
  is_source boolean not null default false,
  is_active boolean not null default true,
  fallback_code text references public.locales(code),
  ts_config text not null default 'simple',
  sort_order int not null default 0
);
alter table public.locales enable row level security;

create policy "anyone_reads_active_locales"
on public.locales for select
to anon, authenticated
using (is_active = true);

create table public.coded_values (
  kind text not null,
  code text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key (kind, code)
);
alter table public.coded_values enable row level security;

create policy "anyone_reads_active_codes"
on public.coded_values for select
to anon, authenticated
using (is_active = true);

create table public.coded_value_translations (
  kind text not null,
  code text not null,
  locale text not null references public.locales(code),
  label text not null,
  primary key (kind, code, locale),
  foreign key (kind, code) references public.coded_values(kind, code) on delete cascade
);
alter table public.coded_value_translations enable row level security;

create policy "anyone_reads_code_labels"
on public.coded_value_translations for select
to anon, authenticated
using (true);

create table public.product_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.product_settings enable row level security;

create policy "anyone_reads_settings"
on public.product_settings for select
to anon, authenticated
using (true);

create trigger trg_product_settings_updated
before update on public.product_settings
for each row execute function private.set_updated_at();

create table public.audit_log (
  id bigserial primary key,
  actor_id uuid,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  meta jsonb,
  created_at timestamptz not null default now()
);
alter table public.audit_log enable row level security;

create table public.domain_outbox (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  aggregate_type text not null,
  aggregate_id uuid not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  status_kind text generated always as ('outbox_status') stored,
  attempts int not null default 0,
  available_at timestamptz not null default now(),
  last_error text,
  created_at timestamptz not null default now(),
  published_at timestamptz,
  foreign key (status_kind, status) references public.coded_values(kind, code)
);
alter table public.domain_outbox enable row level security;
create index idx_outbox_claim on public.domain_outbox (status, available_at) where status in ('pending', 'failed');

insert into public.locales (code, bcp47, native_name, dir, is_source, fallback_code, ts_config, sort_order) values
  ('tr', 'tr-CY', 'Türkçe', 'ltr', true, null, 'turkish', 1),
  ('en', 'en', 'English', 'ltr', false, 'tr', 'english', 2),
  ('ru', 'ru', 'Русский', 'ltr', false, 'en', 'simple', 3),
  ('he', 'he', 'עברית', 'rtl', false, 'en', 'simple', 4);

insert into public.coded_values (kind, code, sort_order, meta) values
  ('system_role', 'candidate', 1, '{}'),
  ('system_role', 'employer', 2, '{}'),
  ('system_role', 'admin', 3, '{}'),
  ('org_member_role', 'owner', 1, '{}'),
  ('org_member_role', 'recruiter', 2, '{}'),
  ('org_member_role', 'viewer', 3, '{}'),
  ('remote_type', 'remote', 1, '{}'),
  ('remote_type', 'hybrid', 2, '{}'),
  ('remote_type', 'onsite', 3, '{}'),
  ('remote_type', 'any', 4, '{"candidate_only": true}'),
  ('employment_type', 'FULL_TIME', 1, '{"schema_org": "FULL_TIME"}'),
  ('employment_type', 'PART_TIME', 2, '{"schema_org": "PART_TIME"}'),
  ('employment_type', 'CONTRACTOR', 3, '{"schema_org": "CONTRACTOR"}'),
  ('employment_type', 'INTERN', 4, '{"schema_org": "INTERN"}'),
  ('employment_type', 'TEMPORARY', 5, '{"schema_org": "TEMPORARY"}'),
  ('experience_level', 'entry', 1, '{}'),
  ('experience_level', 'mid', 2, '{}'),
  ('experience_level', 'senior', 3, '{}'),
  ('experience_level', 'lead', 4, '{}'),
  ('job_status', 'draft', 1, '{}'),
  ('job_status', 'active', 2, '{}'),
  ('job_status', 'expired', 3, '{}'),
  ('job_status', 'removed', 4, '{}'),
  ('translation_status', 'draft', 1, '{}'),
  ('translation_status', 'published', 2, '{}'),
  ('application_status', 'submitted', 1, '{}'),
  ('application_status', 'viewed', 2, '{}'),
  ('application_status', 'shortlisted', 3, '{}'),
  ('application_status', 'rejected', 4, '{}'),
  ('application_status', 'hired', 5, '{}'),
  ('badge_type', 'email', 1, '{}'),
  ('badge_type', 'phone', 2, '{}'),
  ('badge_type', 'company', 3, '{}'),
  ('badge_type', 'identity', 4, '{}'),
  ('badge_status', 'pending', 1, '{}'),
  ('badge_status', 'verified', 2, '{}'),
  ('badge_status', 'rejected', 3, '{}'),
  ('document_type', 'identity', 1, '{}'),
  ('document_type', 'tax_certificate', 2, '{}'),
  ('document_type', 'other', 3, '{}'),
  ('document_status', 'pending', 1, '{}'),
  ('document_status', 'verified', 2, '{}'),
  ('document_status', 'rejected', 3, '{}'),
  ('cv_status', 'processing', 1, '{}'),
  ('cv_status', 'ready', 2, '{}'),
  ('cv_status', 'failed', 3, '{}'),
  ('outbox_status', 'pending', 1, '{}'),
  ('outbox_status', 'processing', 2, '{}'),
  ('outbox_status', 'published', 3, '{}'),
  ('outbox_status', 'failed', 4, '{}'),
  ('content_source', 'manual', 1, '{}'),
  ('content_source', 'ai_extracted', 2, '{}'),
  ('skill_proficiency', 'beginner', 1, '{}'),
  ('skill_proficiency', 'intermediate', 2, '{}'),
  ('skill_proficiency', 'advanced', 3, '{}'),
  ('skill_proficiency', 'expert', 4, '{}');

insert into public.product_settings (key, value) values
  ('jobs.default_expiry_days', '45'::jsonb),
  ('cv.parse.daily_quota', '5'::jsonb),
  ('search.facet_refresh_minutes', '10'::jsonb),
  ('applications.daily_cap_per_user', '20'::jsonb);

-- ============================================================
-- 0002: Catalog Setup
-- ============================================================

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

-- ============================================================
-- 0003: Identity Setup
-- ============================================================

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  phone text,
  created_at timestamptz not null default now()
);
alter table public.users enable row level security;

create policy "users_read_own"
on public.users for select
to authenticated
using (id = (select auth.uid()));

create table public.user_roles (
  user_id uuid not null references public.users(id) on delete cascade,
  role_kind text generated always as ('system_role') stored,
  role_code text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, role_code),
  foreign key (role_kind, role_code) references public.coded_values(kind, code)
);
alter table public.user_roles enable row level security;

create policy "users_read_own_roles"
on public.user_roles for select
to authenticated
using (user_id = (select auth.uid()));

create or replace function private.has_system_role(p_role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = (select auth.uid())
      and role_code = p_role
  );
$$;
grant execute on function private.has_system_role(text) to authenticated, anon;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_email text;
begin
  insert into public.users (id, email, phone)
  values (new.id, new.email, new.phone);

  insert into public.user_roles (user_id, role_code)
  values (new.id, 'candidate');

  select value #>> '{}' into admin_email
  from public.product_settings
  where key = 'bootstrap.admin_email';

  if admin_email is not null and new.email is not null and lower(new.email) = lower(admin_email) then
    insert into public.user_roles (user_id, role_code)
    values (new.id, 'admin')
    on conflict do nothing;
  end if;

  insert into public.candidate_profiles (user_id)
  values (new.id)
  on conflict do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create policy "admin_writes_locales"
on public.locales for all
to authenticated
using (private.has_system_role('admin'))
with check (private.has_system_role('admin'));

create policy "admin_writes_codes"
on public.coded_values for all
to authenticated
using (private.has_system_role('admin'))
with check (private.has_system_role('admin'));

create policy "admin_writes_code_labels"
on public.coded_value_translations for all
to authenticated
using (private.has_system_role('admin'))
with check (private.has_system_role('admin'));

create policy "admin_writes_settings"
on public.product_settings for all
to authenticated
using (private.has_system_role('admin'))
with check (private.has_system_role('admin'));

create policy "admin_writes_regions"
on public.regions for all to authenticated
using (private.has_system_role('admin'))
with check (private.has_system_role('admin'));

create policy "admin_writes_region_tr"
on public.region_translations for all to authenticated
using (private.has_system_role('admin'))
with check (private.has_system_role('admin'));

create policy "admin_writes_cities"
on public.cities for all to authenticated
using (private.has_system_role('admin'))
with check (private.has_system_role('admin'));

create policy "admin_writes_city_tr"
on public.city_translations for all to authenticated
using (private.has_system_role('admin'))
with check (private.has_system_role('admin'));

create policy "admin_writes_categories"
on public.categories for all to authenticated
using (private.has_system_role('admin'))
with check (private.has_system_role('admin'));

create policy "admin_writes_category_tr"
on public.category_translations for all to authenticated
using (private.has_system_role('admin'))
with check (private.has_system_role('admin'));

create policy "admin_writes_skills"
on public.skills for all to authenticated
using (private.has_system_role('admin'))
with check (private.has_system_role('admin'));

create policy "admin_writes_skill_tr"
on public.skill_translations for all to authenticated
using (private.has_system_role('admin'))
with check (private.has_system_role('admin'));

insert into public.product_settings (key, value)
values ('bootstrap.admin_email', 'null'::jsonb)
on conflict (key) do nothing;

-- ============================================================
-- 0004: Organizations Setup
-- ============================================================

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  legal_name text not null,
  tax_id text,
  logo_path text,
  website text,
  city_id int references public.cities(id),
  verified boolean not null default false,
  verification_source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.organizations enable row level security;

create trigger trg_organizations_updated
before update on public.organizations
for each row execute function private.set_updated_at();

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role_kind text generated always as ('org_member_role') stored,
  role_code text not null,
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id),
  foreign key (role_kind, role_code) references public.coded_values(kind, code)
);
alter table public.organization_members enable row level security;
create index idx_org_members_user on public.organization_members (user_id);

create or replace function private.is_org_member(p_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members
    where organization_id = p_org
      and user_id = (select auth.uid())
  );
$$;
grant execute on function private.is_org_member(uuid) to authenticated, anon;

create or replace function private.org_can_write(p_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members
    where organization_id = p_org
      and user_id = (select auth.uid())
      and role_code in ('owner', 'recruiter')
  );
$$;
grant execute on function private.org_can_write(uuid) to authenticated;

create policy "public_reads_organizations"
on public.organizations for select
to anon, authenticated
using (true);

create policy "members_update_organization"
on public.organizations for update
to authenticated
using (private.org_can_write(id))
with check (private.org_can_write(id));

create policy "authenticated_insert_organization"
on public.organizations for insert
to authenticated
with check (true);

create policy "members_read_membership"
on public.organization_members for select
to authenticated
using (user_id = (select auth.uid()) or private.is_org_member(organization_id));

create policy "owners_manage_membership"
on public.organization_members for all
to authenticated
using (
  exists (
    select 1 from public.organization_members m
    where m.organization_id = organization_members.organization_id
      and m.user_id = (select auth.uid())
      and m.role_code = 'owner'
  )
)
with check (
  exists (
    select 1 from public.organization_members m
    where m.organization_id = organization_members.organization_id
      and m.user_id = (select auth.uid())
      and m.role_code = 'owner'
  )
);

revoke select (tax_id, verification_source) on public.organizations from anon, authenticated;

alter table public.audit_log
  add constraint audit_log_actor_fk
  foreign key (actor_id) references public.users(id);

-- ============================================================
-- 0005: Candidates Setup
-- ============================================================

create table public.candidate_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  headline text,
  summary text,
  city_id int references public.cities(id),
  remote_kind text generated always as ('remote_type') stored,
  remote_pref text not null default 'any',
  avatar_path text,
  version int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (remote_kind, remote_pref) references public.coded_values(kind, code)
);
alter table public.candidate_profiles enable row level security;

create trigger trg_candidate_profiles_updated
before update on public.candidate_profiles
for each row execute function private.set_updated_at();

create policy "candidates_manage_own_profile"
on public.candidate_profiles for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create table public.candidate_experiences (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidate_profiles(user_id) on delete cascade,
  title text not null,
  company text not null,
  start_date date,
  end_date date,
  is_current boolean not null default false,
  description text,
  source_kind text generated always as ('content_source') stored,
  source text not null default 'manual',
  created_at timestamptz not null default now(),
  foreign key (source_kind, source) references public.coded_values(kind, code)
);
alter table public.candidate_experiences enable row level security;
create index on public.candidate_experiences (candidate_id);

create policy "candidates_manage_own_experiences"
on public.candidate_experiences for all
to authenticated
using (candidate_id = (select auth.uid()))
with check (candidate_id = (select auth.uid()));

create table public.candidate_educations (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidate_profiles(user_id) on delete cascade,
  school text not null,
  degree text,
  field text,
  start_date date,
  end_date date,
  source_kind text generated always as ('content_source') stored,
  source text not null default 'manual',
  created_at timestamptz not null default now(),
  foreign key (source_kind, source) references public.coded_values(kind, code)
);
alter table public.candidate_educations enable row level security;
create index on public.candidate_educations (candidate_id);

create policy "candidates_manage_own_educations"
on public.candidate_educations for all
to authenticated
using (candidate_id = (select auth.uid()))
with check (candidate_id = (select auth.uid()));

create table public.candidate_skills (
  candidate_id uuid not null references public.candidate_profiles(user_id) on delete cascade,
  skill_id int not null references public.skills(id) on delete cascade,
  proficiency_kind text generated always as ('skill_proficiency') stored,
  proficiency text,
  primary key (candidate_id, skill_id),
  foreign key (proficiency_kind, proficiency) references public.coded_values(kind, code)
);
alter table public.candidate_skills enable row level security;

create policy "candidates_manage_own_skills"
on public.candidate_skills for all
to authenticated
using (candidate_id = (select auth.uid()))
with check (candidate_id = (select auth.uid()));

-- ============================================================
-- 0006: Jobs Setup
-- ============================================================

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  category_id int not null references public.categories(id),
  city_id int not null references public.cities(id),
  remote_kind text generated always as ('remote_type') stored,
  remote_type text not null,
  employment_kind text generated always as ('employment_type') stored,
  employment_type text not null,
  experience_kind text generated always as ('experience_level') stored,
  experience_level text,
  salary_min numeric,
  salary_max numeric,
  salary_currency text not null default 'TRY',
  status_kind text generated always as ('job_status') stored,
  status text not null default 'draft',
  source_locale text not null references public.locales(code),
  version int not null default 1,
  published_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (remote_kind, remote_type) references public.coded_values(kind, code),
  foreign key (employment_kind, employment_type) references public.coded_values(kind, code),
  foreign key (experience_kind, experience_level) references public.coded_values(kind, code),
  foreign key (status_kind, status) references public.coded_values(kind, code),
  constraint jobs_salary_range check (salary_min is null or salary_max is null or salary_min <= salary_max)
);
alter table public.jobs enable row level security;

create trigger trg_jobs_updated
before update on public.jobs
for each row execute function private.set_updated_at();

create index idx_jobs_org on public.jobs (organization_id);
create index idx_jobs_active on public.jobs (status) where status = 'active';
create index idx_jobs_filters on public.jobs (city_id, category_id, remote_type);
create index idx_jobs_salary on public.jobs (salary_min, salary_max);
create index idx_jobs_expiry on public.jobs (expires_at) where status = 'active';
create index idx_jobs_published_cursor on public.jobs (published_at desc, id desc) where status = 'active';

create or replace function private.owns_job(target_job_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.jobs j
    where j.id = target_job_id
      and private.is_org_member(j.organization_id)
  );
$$;
grant execute on function private.owns_job(uuid) to authenticated, anon;

create or replace function private.can_write_job(target_job_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.jobs j
    where j.id = target_job_id
      and private.org_can_write(j.organization_id)
  );
$$;
grant execute on function private.can_write_job(uuid) to authenticated;

create policy "public_reads_active_jobs"
on public.jobs for select
to anon, authenticated
using (status = 'active');

create policy "members_read_org_jobs"
on public.jobs for select
to authenticated
using (private.is_org_member(organization_id));

create policy "writers_insert_jobs"
on public.jobs for insert
to authenticated
with check (private.org_can_write(organization_id));

create policy "writers_update_jobs"
on public.jobs for update
to authenticated
using (private.org_can_write(organization_id))
with check (private.org_can_write(organization_id));

create table public.job_translations (
  job_id uuid not null references public.jobs(id) on delete cascade,
  locale text not null references public.locales(code),
  title text not null,
  description text not null,
  slug text not null,
  status_kind text generated always as ('translation_status') stored,
  status text not null default 'draft',
  is_machine_draft boolean not null default false,
  source_revision int not null default 1,
  search_vector tsvector,
  primary key (job_id, locale),
  foreign key (status_kind, status) references public.coded_values(kind, code)
);
alter table public.job_translations enable row level security;
create unique index idx_job_translations_slug on public.job_translations (locale, slug);
create index idx_job_translations_search on public.job_translations using gin (search_vector);

create or replace function private.job_translations_search_vector_update()
returns trigger
language plpgsql
as $$
declare
  cfg regconfig;
begin
  select ts_config::regconfig into cfg from public.locales where code = new.locale;
  new.search_vector := to_tsvector(
    coalesce(cfg, 'simple'::regconfig),
    coalesce(new.title, '') || ' ' || coalesce(new.description, '')
  );
  return new;
end;
$$;

create trigger trg_job_translations_search_vector
before insert or update of title, description, locale on public.job_translations
for each row execute function private.job_translations_search_vector_update();

create policy "public_reads_published_translations"
on public.job_translations for select
to anon, authenticated
using (
  (
    status = 'published'
    and exists (
      select 1 from public.jobs j
      where j.id = job_translations.job_id and j.status = 'active'
    )
  )
  or private.owns_job(job_id)
);

create policy "writers_manage_translations"
on public.job_translations for all
to authenticated
using (private.can_write_job(job_id))
with check (private.can_write_job(job_id));

create table public.job_skills (
  job_id uuid not null references public.jobs(id) on delete cascade,
  skill_id int not null references public.skills(id) on delete cascade,
  primary key (job_id, skill_id)
);
alter table public.job_skills enable row level security;

create policy "public_reads_job_skills"
on public.job_skills for select
to anon, authenticated
using (
  exists (select 1 from public.jobs j where j.id = job_id and j.status = 'active')
  or private.owns_job(job_id)
);

create policy "writers_manage_job_skills"
on public.job_skills for all
to authenticated
using (private.can_write_job(job_id))
with check (private.can_write_job(job_id));

-- ============================================================
-- 0007: CV Uploads Setup
-- ============================================================

create table public.cv_uploads (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidate_profiles(user_id) on delete cascade,
  storage_path text not null,
  status_kind text generated always as ('cv_status') stored,
  status text not null default 'processing',
  created_at timestamptz not null default now(),
  foreign key (status_kind, status) references public.coded_values(kind, code)
);
alter table public.cv_uploads enable row level security;
create index on public.cv_uploads (candidate_id);

create policy "candidates_manage_own_cv_uploads"
on public.cv_uploads for all
to authenticated
using (candidate_id = (select auth.uid()))
with check (candidate_id = (select auth.uid()));

-- ============================================================
-- 0008: Applications Setup
-- ============================================================

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  candidate_id uuid not null references public.candidate_profiles(user_id) on delete cascade,
  status_kind text generated always as ('application_status') stored,
  status text not null default 'submitted',
  cv_snapshot_id uuid references public.cv_uploads(id) on delete set null,
  cover_note text,
  created_at timestamptz not null default now(),
  unique (job_id, candidate_id),
  foreign key (status_kind, status) references public.coded_values(kind, code)
);
alter table public.applications enable row level security;
create index on public.applications (job_id);
create index on public.applications (candidate_id);

create policy "candidates_view_own_applications"
on public.applications for select
to authenticated
using (candidate_id = (select auth.uid()));

create policy "candidates_submit_applications"
on public.applications for insert
to authenticated
with check (candidate_id = (select auth.uid()));

create policy "candidates_withdraw_applications"
on public.applications for delete
to authenticated
using (candidate_id = (select auth.uid()));

create policy "employers_view_applications_to_own_jobs"
on public.applications for select
to authenticated
using (private.owns_job(job_id));

create policy "employers_update_application_status"
on public.applications for update
to authenticated
using (private.owns_job(job_id))
with check (private.owns_job(job_id));

revoke update on public.applications from authenticated;
grant update (status) on public.applications to authenticated;

create or replace function private.employer_can_view_candidate(target_candidate_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.applications a
    join public.jobs j on j.id = a.job_id
    where a.candidate_id = target_candidate_id
      and private.is_org_member(j.organization_id)
  );
$$;
grant execute on function private.employer_can_view_candidate(uuid) to authenticated;

create policy "employers_view_applicant_profile"
on public.candidate_profiles for select
to authenticated
using (private.employer_can_view_candidate(user_id));

create policy "employers_view_applicant_experiences"
on public.candidate_experiences for select
to authenticated
using (private.employer_can_view_candidate(candidate_id));

create policy "employers_view_applicant_educations"
on public.candidate_educations for select
to authenticated
using (private.employer_can_view_candidate(candidate_id));

create policy "employers_view_applicant_skills"
on public.candidate_skills for select
to authenticated
using (private.employer_can_view_candidate(candidate_id));

create table public.saved_jobs (
  candidate_id uuid not null references public.candidate_profiles(user_id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (candidate_id, job_id)
);
alter table public.saved_jobs enable row level security;

create policy "candidates_manage_own_saved_jobs"
on public.saved_jobs for all
to authenticated
using (candidate_id = (select auth.uid()))
with check (candidate_id = (select auth.uid()));

-- ============================================================
-- 0009: Verification Setup
-- ============================================================

create table public.sensitive_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  type_kind text generated always as ('document_type') stored,
  type text not null,
  storage_path text not null,
  status_kind text generated always as ('document_status') stored,
  status text not null default 'pending',
  reviewed_by uuid references public.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (type_kind, type) references public.coded_values(kind, code),
  foreign key (status_kind, status) references public.coded_values(kind, code)
);
alter table public.sensitive_documents enable row level security;

create table public.verification_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  type_kind text generated always as ('badge_type') stored,
  type text not null,
  status_kind text generated always as ('badge_status') stored,
  status text not null default 'pending',
  method text,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (type_kind, type) references public.coded_values(kind, code),
  foreign key (status_kind, status) references public.coded_values(kind, code)
);
alter table public.verification_badges enable row level security;
create unique index idx_badges_user_type
  on public.verification_badges (user_id, type)
  where organization_id is null;
create unique index idx_badges_org_type
  on public.verification_badges (user_id, type, organization_id)
  where organization_id is not null;

create policy "users_read_own_badges"
on public.verification_badges for select
to authenticated
using (user_id = (select auth.uid()));

create policy "anyone_reads_verified_badges"
on public.verification_badges for select
to anon, authenticated
using (status = 'verified');

-- ============================================================
-- 0010: CV Extraction Setup
-- ============================================================

create table public.cv_extraction_results (
  id uuid primary key default gen_random_uuid(),
  cv_upload_id uuid not null unique references public.cv_uploads(id) on delete cascade,
  raw_json jsonb not null,
  confidence jsonb,
  confirmed boolean not null default false,
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.cv_extraction_results enable row level security;

create policy "candidates_manage_own_extraction_results"
on public.cv_extraction_results for all
to authenticated
using (
  exists (
    select 1 from public.cv_uploads u
    where u.id = cv_upload_id and u.candidate_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.cv_uploads u
    where u.id = cv_upload_id and u.candidate_id = (select auth.uid())
  )
);

-- ============================================================
-- 0011: Search Setup
-- ============================================================

create materialized view public.job_facet_counts as
select
  jt.locale,
  j.city_id,
  j.category_id,
  j.remote_type,
  count(*)::int as job_count
from public.jobs j
join public.job_translations jt on jt.job_id = j.id
where j.status = 'active'
  and jt.status = 'published'
group by jt.locale, j.city_id, j.category_id, j.remote_type;

create unique index idx_job_facet_counts_pk
on public.job_facet_counts (locale, city_id, category_id, remote_type);

create or replace function private.refresh_job_facet_counts()
returns void
language sql
security definer
set search_path = public
as $$
  refresh materialized view concurrently public.job_facet_counts;
$$;
revoke all on function private.refresh_job_facet_counts() from public;
grant execute on function private.refresh_job_facet_counts() to service_role;

-- ============================================================
-- 0012: Storage Setup
-- ============================================================

insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('company-logos', 'company-logos', true),
  ('cv-uploads', 'cv-uploads', false),
  ('verification-documents', 'verification-documents', false)
on conflict (id) do nothing;

create policy "owners_manage_own_cv_files"
on storage.objects for all
to authenticated
using (bucket_id = 'cv-uploads' and (select auth.uid())::text = (storage.foldername(name))[1])
with check (bucket_id = 'cv-uploads' and (select auth.uid())::text = (storage.foldername(name))[1]);

create policy "owners_upload_own_verification_docs"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'verification-documents'
  and (select auth.uid())::text = (storage.foldername(name))[1]
);

create policy "owners_read_own_verification_docs"
on storage.objects for select
to authenticated
using (
  bucket_id = 'verification-documents'
  and (select auth.uid())::text = (storage.foldername(name))[1]
);

create policy "anyone_reads_avatars"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'avatars');

create policy "owners_write_own_avatar"
on storage.objects for all
to authenticated
using (bucket_id = 'avatars' and (select auth.uid())::text = (storage.foldername(name))[1])
with check (bucket_id = 'avatars' and (select auth.uid())::text = (storage.foldername(name))[1]);

create policy "anyone_reads_company_logos"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'company-logos');

create policy "members_write_company_logos"
on storage.objects for all
to authenticated
using (
  bucket_id = 'company-logos'
  and private.is_org_member(((storage.foldername(name))[1])::uuid)
)
with check (
  bucket_id = 'company-logos'
  and private.org_can_write(((storage.foldername(name))[1])::uuid)
);

-- ============================================================
-- 0013: RPCs Setup
-- ============================================================

grant select on public.job_facet_counts to anon, authenticated;

create or replace function public.search_jobs(
  p_locale text,
  p_q text default null,
  p_city text default null,
  p_category text default null,
  p_remote text default null,
  p_employment text default null,
  p_experience text default null,
  p_salary_min numeric default null,
  p_salary_max numeric default null,
  p_cursor_published timestamptz default null,
  p_cursor_id uuid default null,
  p_limit int default 20
)
returns table (
  id uuid,
  slug text,
  locale text,
  title text,
  city_slug text,
  category_slug text,
  remote_type text,
  employment_type text,
  salary_min numeric,
  salary_max numeric,
  salary_currency text,
  published_at timestamptz,
  organization_name text,
  verified_organization boolean
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    j.id,
    jt.slug,
    jt.locale,
    jt.title,
    c.slug,
    cat.slug,
    j.remote_type,
    j.employment_type,
    j.salary_min,
    j.salary_max,
    j.salary_currency,
    j.published_at,
    o.legal_name,
    o.verified
  from public.jobs j
  join public.job_translations jt on jt.job_id = j.id
  join public.cities c on c.id = j.city_id
  join public.categories cat on cat.id = j.category_id
  join public.organizations o on o.id = j.organization_id
  where j.status = 'active'
    and jt.status = 'published'
    and jt.locale = p_locale
    and (p_q is null or length(trim(p_q)) = 0 or jt.search_vector @@ websearch_to_tsquery(
      coalesce((select ts_config::regconfig from public.locales where code = p_locale), 'simple'::regconfig),
      p_q
    ))
    and (p_city is null or c.slug = p_city)
    and (p_category is null or cat.slug = p_category)
    and (p_remote is null or j.remote_type = p_remote)
    and (p_employment is null or j.employment_type = p_employment)
    and (p_experience is null or j.experience_level = p_experience)
    and (p_salary_min is null or j.salary_max is null or j.salary_max >= p_salary_min)
    and (p_salary_max is null or j.salary_min is null or j.salary_min <= p_salary_max)
    and (
      p_cursor_published is null
      or j.published_at < p_cursor_published
      or (j.published_at = p_cursor_published and j.id < p_cursor_id)
    )
  order by j.published_at desc nulls last, j.id desc
  limit greatest(1, least(coalesce(p_limit, 20), 50));
$$;

grant execute on function public.search_jobs(
  text, text, text, text, text, text, text, numeric, numeric, timestamptz, uuid, int
) to anon, authenticated;

create or replace function public.get_published_job(p_locale text, p_slug text)
returns table (
  id uuid,
  slug text,
  locale text,
  title text,
  description text,
  city_slug text,
  category_slug text,
  remote_type text,
  employment_type text,
  salary_min numeric,
  salary_max numeric,
  salary_currency text,
  published_at timestamptz,
  expires_at timestamptz,
  organization_id uuid,
  organization_name text,
  verified_organization boolean
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    j.id,
    jt.slug,
    jt.locale,
    jt.title,
    jt.description,
    c.slug,
    cat.slug,
    j.remote_type,
    j.employment_type,
    j.salary_min,
    j.salary_max,
    j.salary_currency,
    j.published_at,
    j.expires_at,
    o.id,
    o.legal_name,
    o.verified
  from public.job_translations jt
  join public.jobs j on j.id = jt.job_id
  join public.cities c on c.id = j.city_id
  join public.categories cat on cat.id = j.category_id
  join public.organizations o on o.id = j.organization_id
  where jt.locale = p_locale
    and jt.slug = p_slug
    and jt.status = 'published'
    and j.status = 'active'
  limit 1;
$$;

grant execute on function public.get_published_job(text, text) to anon, authenticated;

create or replace function public.create_organization_with_owner(
  p_slug text,
  p_legal_name text,
  p_website text default null,
  p_city_id int default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := (select auth.uid());
  oid uuid;
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;

  insert into public.organizations (slug, legal_name, website, city_id)
  values (p_slug, p_legal_name, p_website, p_city_id)
  returning id into oid;

  insert into public.organization_members (organization_id, user_id, role_code)
  values (oid, uid, 'owner');

  insert into public.user_roles (user_id, role_code)
  values (uid, 'employer')
  on conflict do nothing;

  return oid;
end;
$$;

grant execute on function public.create_organization_with_owner(text, text, text, int) to authenticated;

create or replace function private.claim_outbox(p_limit int)
returns setof public.domain_outbox
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with picked as (
    select o.id
    from public.domain_outbox o
    where o.status in ('pending', 'failed')
      and o.available_at <= now()
    order by o.created_at
    for update skip locked
    limit greatest(1, least(coalesce(p_limit, 10), 50))
  )
  update public.domain_outbox d
  set
    status = 'processing',
    attempts = d.attempts + 1
  from picked
  where d.id = picked.id
  returning d.*;
end;
$$;

grant usage on schema private to service_role;
revoke all on function private.claim_outbox(int) from public;
grant execute on function private.claim_outbox(int) to service_role;

create or replace function public.claim_outbox(p_limit int)
returns setof public.domain_outbox
language sql
security definer
set search_path = public, private
as $$
  select * from private.claim_outbox(p_limit);
$$;
revoke all on function public.claim_outbox(int) from public;
grant execute on function public.claim_outbox(int) to service_role;

create or replace function public.enqueue_outbox(
  p_event_type text,
  p_aggregate_type text,
  p_aggregate_id uuid,
  p_payload jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  oid uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'not_authenticated';
  end if;
  if p_event_type not in ('cv.parse.requested', 'job.translation.requested') then
    raise exception 'event_not_allowed';
  end if;
  insert into public.domain_outbox (event_type, aggregate_type, aggregate_id, payload)
  values (p_event_type, p_aggregate_type, p_aggregate_id, coalesce(p_payload, '{}'::jsonb))
  returning id into oid;
  return oid;
end;
$$;
grant execute on function public.enqueue_outbox(text, text, uuid, jsonb) to authenticated;

-- ============================================================
-- 0014: CV Confirmation and Final Setup
-- ============================================================

create or replace function public.replace_profile_from_confirmed_cv(p_payload jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := (select auth.uid());
  upload_id uuid;
  v_city_id int;
  exp jsonb;
  edu jsonb;
  sk jsonb;
  v_skill_id int;
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;

  upload_id := (p_payload->>'cvUploadId')::uuid;
  if upload_id is null then
    raise exception 'cv_required';
  end if;

  if not exists (
    select 1 from public.cv_uploads u
    where u.id = upload_id and u.candidate_id = uid
  ) then
    raise exception 'cv_not_found';
  end if;

  if coalesce(p_payload->>'citySlug', '') <> '' then
    select c.id into v_city_id from public.cities c where c.slug = p_payload->>'citySlug';
  end if;

  update public.candidate_profiles
  set
    headline = nullif(p_payload->>'headline', ''),
    summary = nullif(p_payload->>'summary', ''),
    city_id = v_city_id,
    remote_pref = coalesce(nullif(p_payload->>'remotePref', ''), 'any')
  where user_id = uid;

  delete from public.candidate_experiences where candidate_id = uid;
  delete from public.candidate_educations where candidate_id = uid;
  delete from public.candidate_skills where candidate_id = uid;

  for exp in select value from jsonb_array_elements(coalesce(p_payload->'experiences', '[]'::jsonb))
  loop
    insert into public.candidate_experiences (
      candidate_id, title, company, start_date, end_date, is_current, description, source
    ) values (
      uid,
      exp->>'title',
      exp->>'company',
      nullif(exp->>'startDate', '')::date,
      nullif(exp->>'endDate', '')::date,
      coalesce((exp->>'isCurrent')::boolean, false),
      nullif(exp->>'description', ''),
      'ai_extracted'
    );
  end loop;

  for edu in select value from jsonb_array_elements(coalesce(p_payload->'educations', '[]'::jsonb))
  loop
    insert into public.candidate_educations (
      candidate_id, school, degree, field, start_date, end_date, source
    ) values (
      uid,
      edu->>'school',
      nullif(edu->>'degree', ''),
      nullif(edu->>'field', ''),
      nullif(edu->>'startDate', '')::date,
      nullif(edu->>'endDate', '')::date,
      'ai_extracted'
    );
  end loop;

  for sk in select value from jsonb_array_elements(coalesce(p_payload->'skills', '[]'::jsonb))
  loop
    select s.id into v_skill_id from public.skills s where s.slug = sk->>'slug';
    if v_skill_id is not null then
      insert into public.candidate_skills (candidate_id, skill_id, proficiency)
      values (uid, v_skill_id, nullif(sk->>'proficiency', ''))
      on conflict (candidate_id, skill_id) do update
        set proficiency = excluded.proficiency;
    end if;
    v_skill_id := null;
  end loop;

  update public.cv_extraction_results
  set confirmed = true, confirmed_at = now()
  where cv_upload_id = upload_id;
end;
$$;

grant execute on function public.replace_profile_from_confirmed_cv(jsonb) to authenticated;

create or replace function public.refresh_job_facet_counts()
returns void
language sql
security definer
set search_path = public, private
as $$
  select private.refresh_job_facet_counts();
$$;
revoke all on function public.refresh_job_facet_counts() from public;
grant execute on function public.refresh_job_facet_counts() to service_role;

-- ============================================================
-- Admin Email Setup
-- ============================================================

update public.product_settings
set value = to_jsonb('admin@isbulkıbrıs.com'::text)
where key = 'bootstrap.admin_email';