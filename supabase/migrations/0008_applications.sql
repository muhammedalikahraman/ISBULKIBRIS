-- 0008 applications, saved_jobs, ertelenmiş işveren-aday görünürlüğü
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
