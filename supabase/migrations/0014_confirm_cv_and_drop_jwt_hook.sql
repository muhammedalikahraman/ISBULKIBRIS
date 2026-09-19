-- 0014: CV onay atomik; kullanılmayan JWT hook kaldırılır (RLS user_roles'a bakar)
create or replace function public.replace_profile_from_confirmed_cv(p_payload jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := (select auth.uid());
  upload_id uuid;
  v_city_id int;
  exp jsonb;
  edu jsonb;
  sk jsonb;
  v_skill_id int;
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;

  upload_id := (p_payload->>'cvUploadId')::uuid;
  if upload_id is null then
    raise exception 'cv_required';
  end if;

  if not exists (
    select 1 from public.cv_uploads u
    where u.id = upload_id and u.candidate_id = uid
  ) then
    raise exception 'cv_not_found';
  end if;

  if coalesce(p_payload->>'citySlug', '') <> '' then
    select c.id into v_city_id from public.cities c where c.slug = p_payload->>'citySlug';
  end if;

  update public.candidate_profiles
  set
    headline = nullif(p_payload->>'headline', ''),
    summary = nullif(p_payload->>'summary', ''),
    city_id = v_city_id,
    remote_pref = coalesce(nullif(p_payload->>'remotePref', ''), 'any')
  where user_id = uid;

  delete from public.candidate_experiences where candidate_id = uid;
  delete from public.candidate_educations where candidate_id = uid;
  delete from public.candidate_skills where candidate_id = uid;

  for exp in select value from jsonb_array_elements(coalesce(p_payload->'experiences', '[]'::jsonb))
  loop
    insert into public.candidate_experiences (
      candidate_id, title, company, start_date, end_date, is_current, description, source
    ) values (
      uid,
      exp->>'title',
      exp->>'company',
      nullif(exp->>'startDate', '')::date,
      nullif(exp->>'endDate', '')::date,
      coalesce((exp->>'isCurrent')::boolean, false),
      nullif(exp->>'description', ''),
      'ai_extracted'
    );
  end loop;

  for edu in select value from jsonb_array_elements(coalesce(p_payload->'educations', '[]'::jsonb))
  loop
    insert into public.candidate_educations (
      candidate_id, school, degree, field, start_date, end_date, source
    ) values (
      uid,
      edu->>'school',
      nullif(edu->>'degree', ''),
      nullif(edu->>'field', ''),
      nullif(edu->>'startDate', '')::date,
      nullif(edu->>'endDate', '')::date,
      'ai_extracted'
    );
  end loop;

  for sk in select value from jsonb_array_elements(coalesce(p_payload->'skills', '[]'::jsonb))
  loop
    select s.id into v_skill_id from public.skills s where s.slug = sk->>'slug';
    if v_skill_id is not null then
      insert into public.candidate_skills (candidate_id, skill_id, proficiency)
      values (uid, v_skill_id, nullif(sk->>'proficiency', ''))
      on conflict (candidate_id, skill_id) do update
        set proficiency = excluded.proficiency;
    end if;
    v_skill_id := null;
  end loop;

  update public.cv_extraction_results
  set confirmed = true, confirmed_at = now()
  where cv_upload_id = upload_id;
end;
$$;

grant execute on function public.replace_profile_from_confirmed_cv(jsonb) to authenticated;

revoke execute on function public.custom_access_token_hook(jsonb) from supabase_auth_admin;
drop function if exists public.custom_access_token_hook(jsonb);

create or replace function public.refresh_job_facet_counts()
returns void
language sql
security definer
set search_path = public, private
as $$
  select private.refresh_job_facet_counts();
$$;
revoke all on function public.refresh_job_facet_counts() from public;
grant execute on function public.refresh_job_facet_counts() to service_role;

