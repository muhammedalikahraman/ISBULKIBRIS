-- 0005 candidates
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
