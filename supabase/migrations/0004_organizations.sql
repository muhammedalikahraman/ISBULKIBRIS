-- 0004 organizations: şirket varlık, üyelik (işveren ≠ tek kullanıcı)
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
-- ilk üye satırı aynı transaction'da service/server action ile yazılmalı

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
