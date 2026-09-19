-- CI: bu sorgu sıfır satır dönmeli.
select tablename
from pg_tables
where schemaname = 'public'
  and rowsecurity = false;
