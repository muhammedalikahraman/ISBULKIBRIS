-- Base44 local dev: post-migration grants so the anon role (used by PostgREST)
-- can read the catalog and job tables that the security-invoker RPCs touch.

grant select on all tables in schema public to anon, authenticated;
grant usage  on all sequences in schema public to anon, authenticated;
grant usage  on schema public to anon, authenticated;
