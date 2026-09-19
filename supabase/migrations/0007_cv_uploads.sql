-- 0007 cv_uploads — applications.cv_snapshot_id FK'sinden ÖNCE (v3 sıra hatası düzeltmesi)
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
