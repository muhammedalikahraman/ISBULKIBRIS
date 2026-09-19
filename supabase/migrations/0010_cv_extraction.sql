-- 0010 cv extraction — profil tablolarına yazma YOK; confirm servisi yazar
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
