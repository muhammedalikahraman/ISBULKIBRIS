-- Kayıt olmadan ÖNCE çalıştır. E-postayı kendi adresinle değiştir.
update public.product_settings
set value = to_jsonb('admin@isbulkıbrıs.com'::text)
where key = 'bootstrap.admin_email';
