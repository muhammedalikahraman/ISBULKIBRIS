-- 0003 identity: users, roller, auth trigger, JWT hook, admin yazma politikaları
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
-- rol yazma: service-role only (politika yok)

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
begin
  insert into public.users (id, email, phone)
  values (new.id, new.email, new.phone);
  insert into public.user_roles (user_id, role_code)
  values (new.id, 'candidate');
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  claims jsonb;
  roles jsonb;
begin
  select coalesce(jsonb_agg(role_code), '[]'::jsonb)
    into roles
  from public.user_roles
  where user_id = (event->>'user_id')::uuid;

  claims := coalesce(event->'claims', '{}'::jsonb);
  claims := jsonb_set(claims, '{user_roles}', roles);
  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$;

grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;

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
