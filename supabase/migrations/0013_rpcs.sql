-- 0013: arama, outbox claim, org bootstrap, facet grant, admin e-posta kancası
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

insert into public.product_settings (key, value)
values ('bootstrap.admin_email', 'null'::jsonb)
on conflict (key) do nothing;
