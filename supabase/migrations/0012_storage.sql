-- 0012 storage buckets + path-segment RLS
insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('company-logos', 'company-logos', true),
  ('cv-uploads', 'cv-uploads', false),
  ('verification-documents', 'verification-documents', false)
on conflict (id) do nothing;

create policy "owners_manage_own_cv_files"
on storage.objects for all
to authenticated
using (bucket_id = 'cv-uploads' and (select auth.uid())::text = (storage.foldername(name))[1])
with check (bucket_id = 'cv-uploads' and (select auth.uid())::text = (storage.foldername(name))[1]);

create policy "owners_upload_own_verification_docs"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'verification-documents'
  and (select auth.uid())::text = (storage.foldername(name))[1]
);

create policy "owners_read_own_verification_docs"
on storage.objects for select
to authenticated
using (
  bucket_id = 'verification-documents'
  and (select auth.uid())::text = (storage.foldername(name))[1]
);

create policy "anyone_reads_avatars"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'avatars');

create policy "owners_write_own_avatar"
on storage.objects for all
to authenticated
using (bucket_id = 'avatars' and (select auth.uid())::text = (storage.foldername(name))[1])
with check (bucket_id = 'avatars' and (select auth.uid())::text = (storage.foldername(name))[1]);

create policy "anyone_reads_company_logos"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'company-logos');

create policy "members_write_company_logos"
on storage.objects for all
to authenticated
using (
  bucket_id = 'company-logos'
  and private.is_org_member(((storage.foldername(name))[1])::uuid)
)
with check (
  bucket_id = 'company-logos'
  and private.org_can_write(((storage.foldername(name))[1])::uuid)
);
