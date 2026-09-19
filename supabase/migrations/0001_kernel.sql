-- 0001 kernel: private şema, locale, coded_values, settings, audit, outbox, yardımcılar
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
-- admin yazma politikası: 0003 (has_system_role tanımından sonra)


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
-- yazma: yalnızca service-role / admin politikası 0003'te

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
-- KASITLI: politika yok — service-role only

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
-- KASITLI: politika yok — service-role only (kuyruk tüketicisi)
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
