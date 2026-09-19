-- 0009 verification: belgeler service-role; rozet okuma bölünmüş
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
-- KASITLI: create policy yok. RLS açık, yalnızca service-role.

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
-- yazma politikası yok — admin karar akışı service-role
