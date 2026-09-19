-- 0011 search facets — canlı COUNT yerine yenilenen materialized view
create materialized view public.job_facet_counts as
select
  jt.locale,
  j.city_id,
  j.category_id,
  j.remote_type,
  count(*)::int as job_count
from public.jobs j
join public.job_translations jt on jt.job_id = j.id
where j.status = 'active'
  and jt.status = 'published'
group by jt.locale, j.city_id, j.category_id, j.remote_type;

create unique index idx_job_facet_counts_pk
on public.job_facet_counts (locale, city_id, category_id, remote_type);

create or replace function private.refresh_job_facet_counts()
returns void
language sql
security definer
set search_path = public
as $$
  refresh materialized view concurrently public.job_facet_counts;
$$;
revoke all on function private.refresh_job_facet_counts() from public;
grant execute on function private.refresh_job_facet_counts() to service_role;
