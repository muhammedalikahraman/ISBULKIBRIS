-- 0006 jobs + translations + extensible attributes + search vector
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

create table public.job_attributes (
  job_id uuid not null references public.jobs(id) on delete cascade,
  attr_kind text generated always as ('job_attribute') stored,
  attr_code text not null,
  value text not null,
  primary key (job_id, attr_code),
  foreign key (attr_kind, attr_code) references public.coded_values(kind, code)
);
alter table public.job_attributes enable row level security;

create policy "public_reads_job_attributes"
on public.job_attributes for select
to anon, authenticated
using (
  exists (select 1 from public.jobs j where j.id = job_id and j.status = 'active')
  or private.owns_job(job_id)
);

create policy "writers_manage_job_attributes"
on public.job_attributes for all
to authenticated
using (private.can_write_job(job_id))
with check (private.can_write_job(job_id));
