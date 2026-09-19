-- Base44 local dev stub: mimics the Supabase platform schema/roles that the
-- project's migrations depend on (auth.*, storage.*) so migrations apply
-- cleanly on a plain Postgres instance. NOT for production.

-- Reset: allow idempotent re-runs (volume persists between restarts)
DROP SCHEMA IF EXISTS public   CASCADE;
DROP SCHEMA IF EXISTS private  CASCADE;
DROP SCHEMA IF EXISTS auth     CASCADE;
DROP SCHEMA IF EXISTS storage  CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;

-- ── Roles ──────────────────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin bypassrls;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'supabase_auth_admin') then
    create role supabase_auth_admin nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticator') then
    create role authenticator login password 'postgres' noinherit;
  end if;
end $$;

grant anon       to authenticator;
grant authenticated to authenticator;

-- ── auth schema (stub of Supabase Auth) ───────────────────────────────────
create schema if not exists auth;

create table if not exists auth.users (
  id          uuid primary key default gen_random_uuid(),
  email       text,
  phone       text,
  created_at  timestamptz not null default now()
);

create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select null::uuid;
$$;

-- ── storage schema (stub of Supabase Storage) ─────────────────────────────
create schema if not exists storage;

create table if not exists storage.buckets (
  id      text primary key,
  name    text not null,
  public  boolean not null default false
);

create table if not exists storage.objects (
  id          uuid primary key default gen_random_uuid(),
  bucket_id   text references storage.buckets(id),
  name        text not null,
  owner       uuid,
  created_at  timestamptz not null default now()
);

create or replace function storage.foldername(full_path text)
returns text[]
language sql
stable
as $$
  select string_to_array(full_path, '/');
$$;

-- ── Schema usage grants ───────────────────────────────────────────────────
grant usage on schema public       to anon, authenticated, service_role, supabase_auth_admin;
grant usage on schema auth         to anon, authenticated, service_role;
grant usage on schema storage      to anon, authenticated, service_role;
-- private schema is created by migration 0001
