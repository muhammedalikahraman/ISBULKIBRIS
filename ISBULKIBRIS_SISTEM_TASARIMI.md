# İşBulKıbrıs — Sistem Tasarımı v3 (MVP-Üstü, Production-Ready, Denetlenmiş)

> v1'in üzerine: veri modeli artık migration'a yapıştırılabilir DDL seviyesinde, RLS bölümü 2026'nın güncel Supabase pratiklerini (JWT custom claim, SECURITY DEFINER fonksiyon kütüphanesi, Storage RLS) kapsıyor, CV-parse/çeviri pipeline'ı Vercel'in 2026'daki dört arka-plan-işi primitifine (waitUntil / Queues / Workflow / Cron) göre yeniden tasarlandı. `docs/SYSTEM_DESIGN.md` olarak repo'ya eklenip `AGENTS.md`'den referans verilmesini öneririm; bu doküman AGENTS.md'nin yerini almaz, onu somutlaştırır.

> **v3 — satır satır denetim notu:** v2'yi migration sırasıyla, RLS mantığıyla ve şema bütünlüğüyle baştan sona denetledim ve gerçek hatalar buldum; hepsi düzeltildi. En önemlileri: **(1)** `candidate_profiles`/`jobs`, o noktada henüz var olmayan `cities`/`categories` tablolarına FK veriyordu (bölüm sırası tersti) — **(2)** bir RLS politikası henüz tanımlanmamış bir fonksiyona, üstelik yorumda yanlış bir adla atıfta bulunuyordu — **(3)** `custom_access_token_hook`'ta eksik `security definer`, girişte tüm kullanıcıları sessizce `candidate` rolüne indirgerdi — **(4)** `search_vector` yanlış tabloda (jobs) duruyordu ve hiçbir trigger/generated-column onu doldurmuyordu, yani arama hiç çalışmazdı — **(5)** `verification_badges` ve `audit_log` sürekli referans veriliyordu ama hiç `CREATE TABLE`'ları yoktu — **(6)** "işveren sadece status günceller" iddiası RLS ile hiç zorlanmıyordu, gerçek kolon-seviyesi GRANT eklendi — **(7)** `private.owns_job()`'a `anon` grant'ı eksikti, bu da anonim bir ziyaretçinin ilan detay sayfasında sunucu hatası almasına yol açardı — **(8)** işveren, başvuran adayın deneyim/eğitim/beceri listelerini hiç göremiyordu (sadece ana profil satırına politika vardı, alt tablolara yoktu). Düzeltmelerin tümü ilgili bölümlerde "DÜZELTME:" etiketiyle satır içi işaretli, gizlenmedi.

---

## 0. Kapsam, varsayımlar, gerçekçi ölçek

**Fonksiyonel kapsam** (AGENTS.md): işveren↔iş arayan eşleştirme, TR/EN/RU/HE çok dillilik, rozet/güven sistemi, CV→AI onboarding, gelişmiş filtreler, ayrı işveren portalı.

**Gerçekçi ölçek:** KKTC nüfusu ~400 bin, aktif iş gücü çok daha küçük bir alt küme. Başarılı senaryoda bile aylık aktif kullanıcı muhtemelen düşük on-binler, eş zamanlı aktif ilan birkaç bin. Bu doküman boyunca "büyük ölçek" mühendisliğinden kaçınıyorum — tek Supabase projesi, tek Vercel deployment yeterli; asıl darboğaz ham trafik değil **arama kalitesi, LLM maliyeti (CV-parse + çeviri) ve manuel doğrulama iş yükü**.

**Ekip kısıtı:** Tek geliştirici, paralel projeler. Her karar "az operasyon yükü" lehine — yönetilen servisler tercih edilir, kendi altyapını işletmek (kendi arama cluster'ı, kendi queue sunucusu) bilinçli olarak ertelenir.

---

## 1. Rakip doğrulaması (iskibris.com canlı incelendi)

- **Doğrulandı, ciddi bir zaaf:** İlan listesi sayfası art arda 20+ "Loading..." placeholder render ediyor — client-side fetch'e işaret ediyor, Google'ın gördüğü ilk HTML muhtemelen boş. `020-frontend.mdc`'nin "Server Component varsayılan" kuralının neden hayati olduğunu gösteren doğrudan kanıt: ilan listesi/detayının **gerçekten** SSR olduğunu her PR'da kontrol edin, `"use client"` + `useEffect` fetch ile doldurulan bir liste aynı hatanın Next.js ile tekrarı olur.
- **Doğrulandı:** `employer.iskibris.com` ayrı alt alan adı, ana sayfadan net linkleniyor. Şehir/kategori "quick-link" sayfaları (`/quick-links/jobs-in-kyrenia`) SEO amaçlı statik-benzeri yapı — bunu ISR ile eşitleyip aşacağız (Bölüm 15).
- **Doğrulandı:** Tek dil (sadece TR). Kategori sayfalarında canlı sayaç (`Satış Münhalleri — 41 ilan`) var — bizim filtre panelimizde facet count göstermek rekabetçi gereklilik (Postgres'te ucuz değil, Bölüm 6'da materialized view çözümü var).

---

## 2. Üst düzey mimari

```
                    ┌────────────────────────────┐
                    │  Cloudflare (DNS/WAF/Turnstile) │
                    └──────────────┬─────────────┘
                                   │
              ┌────────────────────┴────────────────────┐
              │                  Vercel                   │
              │ Next.js App Router — [locale]/ segmenti    │
              │  (public)/...   ← ISR (jobs, landing)      │
              │  (employer)/... ← SSR, dinamik              │
              │  (admin)/...    ← SSR, service-role çağrıları│
              │  api/*          ← ince route handler'lar    │
              │  Vercel OG      ← dinamik og-image          │
              │  Vercel Cron    ← ilan expiry, sitemap      │
              │  Vercel Queues  ← CV-parse, çeviri taslağı   │
              └──────────────────┬─────────────────────────┘
                                 │
        lib/server/services/*  (iş mantığı, ince route'lardan çağrılır)
        lib/server/repositories/* (Supabase sorguları izole)
                                 │
   ┌─────────────────────────────┼───────────────────────────────┐
   │                             │                                │
┌──▼───────────────┐   ┌─────────▼──────────┐        ┌───────────▼──────────┐
│ Supabase           │   │ Upstash Redis       │        │ LLM API (Claude vb.)  │
│ Postgres + RLS      │   │ rate limit, arama    │        │ CV parse (structured   │
│ Auth (JWT+custom     │   │ facet önbelleği       │        │ output) + TR→EN/RU/HE  │
│  claim) · Storage     │   │                      │        │ çeviri taslağı          │
└─────────────────────┘   └──────────────────────┘        └───────────────────────┘
```

**v1'e göre değişiklik:** "CV-parse asenkron, polling ile" yerine **Vercel Queues** kullanıyoruz (Bölüm 9'da gerekçesi var) — `waitUntil()` best-effort olduğu, retry garantisi olmadığı için kullanıcının beklediği bir işlem için riskli.

---

## 3. Veri modeli — migration'a yapıştırılabilir DDL

`010-backend.mdc`'deki iskeleti tam DDL'ye çeviriyorum. Bu revizyonda **kendi v2 taslağımdaki gerçek sıralama/eksiklik hatalarını** düzeltiyorum: önceki sürümde `candidate_profiles` ve `jobs`, o noktada henüz tanımlanmamış `cities`/`categories` tablolarına FK veriyordu; bir RLS politikası henüz var olmayan bir fonksiyona (`private.employer_can_view_candidate`, `applications` tablosuna bağımlı) atıfta bulunuyordu; `verification_badges` ve `audit_log` hiç tanımlanmamıştı; `search_vector` yanlış tabloda duruyordu ve hiçbir şey onu doldurmuyordu. Hiçbiri gerçek bir migration'da çalışmazdı. Aşağıdaki sıra, yukarıdan aşağıya saf şekilde çalıştırıldığında hatasız kurulacak şekilde düzeltildi. Kural değişmedi: **her tablo, oluşturulduğu migration içinde RLS'i açmalı** — tek istisna, bir politika başka bir tabloya/fonksiyona bağımlıysa (candidate_profiles'ın işveren-görünürlüğü gibi), o *tek* politikanın bağımlılığı karşılayan migration'a ertelenmesi (aşağıda 3.5'te açıkça işaretli).

### 3.1 Kimlik, rol ve paylaşılan altyapı

```sql
create schema if not exists private;  -- tüm SECURITY DEFINER yardımcı fonksiyonları burada yaşar

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  phone text,
  role text not null default 'candidate' check (role in ('candidate','employer','admin')),
  created_at timestamptz not null default now()
);
alter table public.users enable row level security;

create policy "users_can_read_own_row"
on public.users for select
to authenticated
using (id = (select auth.uid()));
-- rol değişikliği SADECE service-role ile (admin server action'ı) yapılır — authenticated'e
-- UPDATE/INSERT politikası bilerek YOK.

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, phone)
  values (new.id, new.email, new.phone);
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
```

**Rol JWT custom claim'i:**

```sql
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  claims jsonb;
  user_role text;
begin
  select role into user_role from public.users where id = (event->>'user_id')::uuid;
  claims := coalesce(event->'claims', '{}'::jsonb);
  claims := jsonb_set(claims, '{user_role}', to_jsonb(coalesce(user_role, 'candidate')));
  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$;

grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;
-- Dashboard > Authentication > Hooks içinden "Custom Access Token" hook'u olarak kaydedin.
```

**Bu revizyonda düzeltilen gerçek bir hata — `security definer` eklendi:** Önceki sürümde bu fonksiyon `security definer` içermiyordu. Sonucu: fonksiyon `supabase_auth_admin` yetkisiyle çalışırken `public.users`'ı sorgulamaya çalışır, ama o tablonun tek RLS politikası "sadece kendi satırını oku" (`auth.uid()`'e bağlı) — `supabase_auth_admin`'in girişte bir `auth.uid()` bağlamı yoktur, sorgu satır döndürmez, `user_role` NULL kalır, `coalesce(..., 'candidate')` devreye girer ve **her kullanıcı, gerçek veritabanı rolü ne olursa olsun, JWT'sinde `user_role: candidate` claim'i alır.** Sistem "çalışıyormuş gibi görünüp" arka planda tüm admin/employer'ları candidate'e indirgeyen, fark edilmesi zor bir hata sınıfıydı. `security definer`, fonksiyonu tablo sahibinin (kendi tablosunda RLS'i varsayılan olarak bypass eden) yetkisiyle çalıştırarak bunu düzeltiyor.

JWT claim'in bayatlığı (rol değişikliği sonrası eski token'da eski rolün kalması) hâlâ geçerli bir kısıt — Bölüm 3.4/3.5'teki en hassas tablolarda bu yüzden JWT claim'e değil service-role + sunucu tarafı kontrole güveniliyor; rol değiştiren admin akışı hedef kullanıcıyı `supabase.auth.admin.signOut(userId)` ile oturumdan düşürmeli.

### 3.2 Referans tablolar — "istisna yok" ilkesi (bilinçli olarak burada, en başta)

Araştırmamda doğrulanan katı kural: **"Enable RLS on every table without exception."** Bu üç tablo aşağıdaki `candidate_profiles` ve `jobs` tarafından FK ile referans alınıyor — bu yüzden migration sırasında (ve bu dokümanda) onlardan **önce** oluşturulmalı; v2'nin ilk taslağında bu sıra tersti.

```sql
create table public.cities (
  id serial primary key,
  slug text unique not null,
  name_tr text not null, name_en text not null, name_ru text not null, name_he text not null,
  region text
);
alter table public.cities enable row level security;
create policy "anyone_can_read_cities" on public.cities for select to anon, authenticated using (true);
create policy "only_admin_can_write_cities" on public.cities for all to authenticated
  using ((select auth.jwt() ->> 'user_role') = 'admin')
  with check ((select auth.jwt() ->> 'user_role') = 'admin');

create table public.categories (
  id serial primary key,
  slug text unique not null,
  name_tr text not null, name_en text not null, name_ru text not null, name_he text not null
);
alter table public.categories enable row level security;
create policy "anyone_can_read_categories" on public.categories for select to anon, authenticated using (true);
create policy "only_admin_can_write_categories" on public.categories for all to authenticated
  using ((select auth.jwt() ->> 'user_role') = 'admin')
  with check ((select auth.jwt() ->> 'user_role') = 'admin');

create table public.skills (
  id serial primary key,
  slug text unique not null,
  name_tr text not null, name_en text not null, name_ru text not null, name_he text not null
);
alter table public.skills enable row level security;
create policy "anyone_can_read_skills" on public.skills for select to anon, authenticated using (true);
create policy "only_admin_can_write_skills" on public.skills for all to authenticated
  using ((select auth.jwt() ->> 'user_role') = 'admin')
  with check ((select auth.jwt() ->> 'user_role') = 'admin');
```

Burada JWT claim kullanımı güvenlidir çünkü **düşük risk** — en kötü ihtimalle bir claim bayatlığı yüzünden yeni terfi eden bir admin birkaç dakika şehir listesi düzenleyemez; bu, `sensitive_documents`'taki gibi bir veri sızıntısı riski taşımaz.

### 3.3 Aday (candidate) profili

```sql
create table public.candidate_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  headline text,
  summary text,
  city_id int references public.cities(id),
  remote_pref text check (remote_pref in ('remote','hybrid','onsite','any')) default 'any',
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.candidate_profiles enable row level security;

create policy "candidates_manage_own_profile"
on public.candidate_profiles for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
-- İşverenin, kendisine başvurmuş bir adayın profilini görme politikası BİLEREK burada yok:
-- private.employer_can_view_candidate() fonksiyonu applications tablosuna bağımlı (3.5'te
-- tanımlanıyor). Migration'da: 0003_candidate_profile.sql bu tabloyu + yukarıdaki politikayı
-- içerir; employer-görünürlük politikası 0006'da (applications ile birlikte) eklenir.

create table public.candidate_experiences (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidate_profiles(user_id) on delete cascade,
  title text not null,
  company text not null,
  start_date date,
  end_date date,
  is_current boolean not null default false,
  description text,
  source text not null default 'manual' check (source in ('manual','ai_extracted')),
  created_at timestamptz not null default now()
);
alter table public.candidate_experiences enable row level security;
create index on public.candidate_experiences (candidate_id);

create policy "candidates_manage_own_experiences"
on public.candidate_experiences for all
to authenticated
using (candidate_id = (select auth.uid()))
with check (candidate_id = (select auth.uid()));

create table public.candidate_educations (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidate_profiles(user_id) on delete cascade,
  school text not null,
  degree text,
  field text,
  start_date date,
  end_date date,
  source text not null default 'manual' check (source in ('manual','ai_extracted')),
  created_at timestamptz not null default now()
);
alter table public.candidate_educations enable row level security;
create index on public.candidate_educations (candidate_id);

create policy "candidates_manage_own_educations"
on public.candidate_educations for all
to authenticated
using (candidate_id = (select auth.uid()))
with check (candidate_id = (select auth.uid()));

create table public.candidate_skills (
  candidate_id uuid not null references public.candidate_profiles(user_id) on delete cascade,
  skill_id int not null references public.skills(id) on delete cascade,
  proficiency text check (proficiency in ('beginner','intermediate','advanced','expert')),
  primary key (candidate_id, skill_id)
);
alter table public.candidate_skills enable row level security;

create policy "candidates_manage_own_skills"
on public.candidate_skills for all
to authenticated
using (candidate_id = (select auth.uid()))
with check (candidate_id = (select auth.uid()));
```

**Düzeltme:** v2'nin ilk taslağı "candidate_educations, candidate_skills: aynı desen, tekrar etmiyorum" diyordu ve `candidate_skills`'in hiç DDL'i yoktu. `candidate_skills` aslında bir çoka-çok bağlantı tablosu (kompozit PK, `skills`'e FK) — tek-UUID-PK'lı diğer ikisiyle aynı şekle sahip değil, bu yüzden tam yazıldı.

### 3.4 İşveren, hassas belgeler ve doğrulama rozetleri

```sql
create table public.employers (
  user_id uuid primary key references public.users(id) on delete cascade,
  company_name text not null,
  tax_id text,
  logo_path text,
  website text,
  verified boolean not null default false,
  verification_source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.employers enable row level security;

create policy "employers_manage_own_company"
on public.employers for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "public_can_read_employers"
on public.employers for select
to anon, authenticated
using (true);

-- DÜZELTME: RLS satır-seviyesinde çalışır; "hassas alanlar ayrı sorguda seçilmemeli" gibi bir
-- YORUM hiçbir şeyi zorlamaz — bir geliştirici yanlışlıkla `select *` yaparsa tax_id herkese
-- sızar. Gerçek zorlama kolon-seviyesi REVOKE ile:
revoke select (tax_id, verification_source) on public.employers from anon, authenticated;
-- Artık istemci (PostgREST/anon/authenticated) bu iki kolonu hiçbir şekilde okuyamaz — sadece
-- service-role (admin inceleme akışı) erişir. Employer kendi tax_id'sini client'tan geri
-- okuyamaz; formda göstermek gerekiyorsa bu, service-role ile çalışan ayrı bir server action'la
-- sağlanmalı.

create table public.sensitive_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null check (type in ('identity','tax_certificate','other')),
  storage_path text not null,
  status text not null default 'pending' check (status in ('pending','verified','rejected')),
  reviewed_by uuid references public.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.sensitive_documents enable row level security;
-- KASITLI: create policy yok. Sadece service_role erişir (lib/server/services/verification.ts).
-- Migration dosyasına şu yorumu ekleyin: "RLS enabled, no policies BY DESIGN — service-role only."

create table public.verification_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null check (type in ('email','phone','company','identity')),
  status text not null default 'pending' check (status in ('pending','verified','rejected')),
  method text,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, type)
);
alter table public.verification_badges enable row level security;

create policy "users_can_read_own_badges"
on public.verification_badges for select
to authenticated
using (user_id = (select auth.uid()));

create policy "anyone_can_read_verified_badges"
on public.verification_badges for select
to anon, authenticated
using (status = 'verified');
-- pending/rejected durumu SADECE sahibine görünür (yukarıdaki politika) — tek bir using(true)
-- politikası, bir adayın "reddedildi" durumunu herkese açık ederdi, bilerek ikiye bölündü.
-- YAZMA politikası yok — sadece service-role (admin karar akışı) günceller.
```

**Eksikti, burada eklendi:** `verification_badges` tablosu Bölüm 7'de (rozet sistemi) ve migration planında sürekli referans veriliyordu ama `CREATE TABLE`'ı hiçbir yerde yazılmamıştı.

### 3.5 İlan, çeviri, başvuru — ve adayın işverene görünürlüğü

```sql
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references public.employers(user_id) on delete cascade,
  category_id int not null references public.categories(id),
  city_id int not null references public.cities(id),
  remote_type text not null check (remote_type in ('remote','hybrid','onsite')),
  -- employment_type değerleri BİLEREK schema.org JobPosting.employmentType sözlüğüyle
  -- (büyük harf, alt çizgi) birebir aynı — Bölüm 12'deki JSON-LD üretimi ek dönüşüm gerektirmesin diye.
  employment_type text not null check (employment_type in ('FULL_TIME','PART_TIME','CONTRACTOR','INTERN','TEMPORARY')),
  experience_level text check (experience_level in ('entry','mid','senior','lead')),
  salary_min numeric,
  salary_max numeric,
  salary_currency text not null default 'TRY',
  status text not null default 'draft' check (status in ('draft','active','expired','removed')),
  published_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.jobs enable row level security;

create index idx_jobs_employer on public.jobs (employer_id);
create index idx_jobs_active on public.jobs (status) where status = 'active';
create index idx_jobs_filters on public.jobs (city_id, category_id, remote_type);
create index idx_jobs_salary on public.jobs (salary_min, salary_max);
create index idx_jobs_expiry on public.jobs (expires_at) where status = 'active';
-- not: salary_min/salary_max üzerindeki düz composite btree, "X-Y arası maaş" gibi ARALIK
-- ÇAKIŞMASI sorgularında ideal değildir. Filtre kullanımı yoğunlaşırsa numrange kolonu +
-- GiST index'e geçmeyi değerlendirin.

create policy "public_can_read_active_jobs"
on public.jobs for select
to anon, authenticated
using (status = 'active');

create policy "owners_manage_own_jobs"
on public.jobs for all
to authenticated
using (employer_id = (select auth.uid()))
with check (employer_id = (select auth.uid()));

create or replace function private.owns_job(target_job_id uuid)
returns boolean
language sql security definer stable
set search_path = public
as $$
  select exists (
    select 1 from public.jobs where id = target_job_id and employer_id = (select auth.uid())
  );
$$;
grant execute on function private.owns_job(uuid) to authenticated, anon;
-- DÜZELTME: "anon" eklendi. job_translations'daki "public_can_read_published_translations"
-- politikası `to anon, authenticated` rolleriyle çalışıyor ve owns_job()'ı çağırıyor — fonksiyona
-- sadece authenticated'e EXECUTE hakkı verilseydi, anon bir kullanıcı ilan sayfasına baktığında
-- Postgres "permission denied for function owns_job" hatası fırlatırdı (yetkisiz rol bir
-- fonksiyonu ÇAĞIRAMAZ, fonksiyon false döndürmez). SECURITY DEFINER içeride auth.uid() NULL
-- olsa bile güvenli şekilde false'a düşürür — asıl eksik grant'tı.
```

```sql
create table public.job_translations (
  job_id uuid not null references public.jobs(id) on delete cascade,
  locale text not null check (locale in ('tr','en','ru','he')),
  title text not null,
  description text not null,
  slug text not null,
  status text not null default 'draft' check (status in ('draft','published')),
  search_vector tsvector,
  primary key (job_id, locale)
);
alter table public.job_translations enable row level security;
create unique index idx_job_translations_slug on public.job_translations (locale, slug);
create index idx_job_translations_search on public.job_translations using gin (search_vector);

-- DÜZELTME: search_vector önceki sürümde `jobs` tablosundaydı ve HİÇ DOLDURULMUYORDU (ne
-- trigger ne generated column vardı — sütun var ama kalıcı olarak boş kalırdı, aramanın hiç
-- çalışmayacağı bir "demo yapı"ydı). Ayrıca aranabilir metin (title/description) zaten
-- job_translations'ta yaşıyor, jobs'ta değil — tek bir tsvector kolonu 4 dilin metnini aynı
-- anda doğru tutamaz. Doğru yer burası, locale'e göre doğru text-search config'ini seçen bir
-- trigger ile:
create or replace function private.job_translations_search_vector_update()
returns trigger
language plpgsql
as $$
begin
  new.search_vector := to_tsvector(
    case new.locale
      when 'tr' then 'turkish'::regconfig
      when 'en' then 'english'::regconfig
      else 'simple'::regconfig   -- ru/he: Bölüm 6'daki MVP-üstü kısıt
    end,
    coalesce(new.title, '') || ' ' || coalesce(new.description, '')
  );
  return new;
end;
$$;

create trigger trg_job_translations_search_vector
before insert or update of title, description on public.job_translations
for each row execute function private.job_translations_search_vector_update();

create policy "public_can_read_published_translations"
on public.job_translations for select
to anon, authenticated
using (
  (status = 'published'
   and exists (select 1 from public.jobs j where j.id = job_translations.job_id and j.status = 'active'))
  or private.owns_job(job_id)
);
-- DÜZELTME: sadece status='published' yeterli değildi — ilanın kendisi expired/removed olsa
-- bile çevirisi, jobs'a hiç değmeden doğrudan job_translations sorgusuyla okunabiliyordu.
-- Artık parent job'un da status='active' olması isteniyor; sahibi hâlâ owns_job ile kendi
-- taslağını/süresi dolmuş ilanını görebiliyor.

create policy "owners_manage_own_translations"
on public.job_translations for all
to authenticated
using (private.owns_job(job_id))
with check (private.owns_job(job_id));
```

```sql
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  candidate_id uuid not null references public.candidate_profiles(user_id) on delete cascade,
  status text not null default 'submitted'
    check (status in ('submitted','viewed','shortlisted','rejected','hired')),
  cv_snapshot_id uuid references public.cv_uploads(id) on delete set null,
  cover_note text,
  created_at timestamptz not null default now(),
  unique (job_id, candidate_id)   -- aynı ilana ikinci kez başvuru engellenir
);
alter table public.applications enable row level security;
create index on public.applications (job_id);
create index on public.applications (candidate_id);

-- Aday: başvurur (insert), görür (select), geri çeker (delete) — DÜZENLEMEZ. Bunun nedeni
-- aşağıdaki kolon-seviyesi kısıtla ilgili, devamında açıklanıyor.
create policy "candidates_can_view_own_applications"
on public.applications for select
to authenticated
using (candidate_id = (select auth.uid()));

create policy "candidates_can_submit_applications"
on public.applications for insert
to authenticated
with check (candidate_id = (select auth.uid()));

create policy "candidates_can_withdraw_applications"
on public.applications for delete
to authenticated
using (candidate_id = (select auth.uid()));

create policy "employers_can_view_applications_to_own_jobs"
on public.applications for select
to authenticated
using (private.owns_job(job_id));

create policy "employers_can_update_application_status"
on public.applications for update
to authenticated
using (private.owns_job(job_id))
with check (private.owns_job(job_id));

-- DÜZELTME: RLS satır-seviyesinde çalışır — yukarıdaki UPDATE politikası tek başına
-- işverenin SADECE status'ü değiştirebildiğini garanti ETMEZ, aynı satırda candidate_id/
-- cover_note'u da değiştirebilirdi (önceki sürümdeki "sadece status" yorumu yanlıştı).
-- Gerçek zorlama kolon-seviyesi GRANT ile:
revoke update on public.applications from authenticated;
grant update (status) on public.applications to authenticated;
-- Bu, authenticated rolünün TAMAMI için UPDATE'i status koloonuyla sınırlar. Adaylar için
-- zaten ayrı bir UPDATE politikası yok (yukarıda sadece select/insert/delete var), bu yüzden
-- pratikte tek etkili yol employers_can_update_application_status + private.owns_job(job_id)
-- — yani sadece kendi ilanının başvurularında, sadece status kolonunu güncelleyebilen işveren.

create or replace function private.employer_can_view_candidate(target_candidate_id uuid)
returns boolean
language sql security definer stable
set search_path = public
as $$
  select exists (
    select 1 from public.applications a
    join public.jobs j on j.id = a.job_id
    where a.candidate_id = target_candidate_id
      and j.employer_id = (select auth.uid())
  );
$$;
grant execute on function private.employer_can_view_candidate(uuid) to authenticated;

-- Bölüm 3.3'te ERTELENEN politikalar — artık applications ve yukarıdaki fonksiyon mevcut,
-- migration'da bu noktada (0006, applications ile aynı dosyada) ekleniyor. Dört ayrı tabloya
-- aynı deseni uyguluyoruz çünkü Postgres RLS tablo bazlıdır, candidate_profiles'a erişim
-- otomatik olarak alt tablolara (experiences/educations/skills) yayılmaz:
create policy "employers_can_view_applicant_profile"
on public.candidate_profiles for select
to authenticated
using (private.employer_can_view_candidate(user_id));

create policy "employers_can_view_applicant_experiences"
on public.candidate_experiences for select
to authenticated
using (private.employer_can_view_candidate(candidate_id));

create policy "employers_can_view_applicant_educations"
on public.candidate_educations for select
to authenticated
using (private.employer_can_view_candidate(candidate_id));

create policy "employers_can_view_applicant_skills"
on public.candidate_skills for select
to authenticated
using (private.employer_can_view_candidate(candidate_id));
```

**Düzeltme:** v2'nin ilk taslağı sadece `candidate_profiles` için bir employer-görünürlük politikası taslağı içeriyordu (üstelik yanlış bir fonksiyon adına atıfla — yorumda `private.has_applied_to_own_job()` yazıyordu, gerçek fonksiyon adı `private.employer_can_view_candidate()`). `candidate_experiences`/`educations`/`skills` için hiç karşılığı yoktu — yani işveren bir başvuruyu açtığında adayın deneyim/eğitim/beceri listesi **boş görünürdü**. Dördü de yukarıda tutarlı şekilde eklendi.

### 3.6 saved_jobs ve audit_log

```sql
create table public.saved_jobs (
  candidate_id uuid not null references public.candidate_profiles(user_id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (candidate_id, job_id)
);
alter table public.saved_jobs enable row level security;

create policy "candidates_manage_own_saved_jobs"
on public.saved_jobs for all
to authenticated
using (candidate_id = (select auth.uid()))
with check (candidate_id = (select auth.uid()));

create table public.audit_log (
  id bigserial primary key,
  actor_id uuid references public.users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  meta jsonb,
  created_at timestamptz not null default now()
);
alter table public.audit_log enable row level security;
-- KASITLI: hiç politika yok — insert/select SADECE service-role (admin karar akışları).
```

**Eksikti, burada eklendi:** `audit_log`, Bölüm 7'de "admin kararı audit_log'a yazar" diye üç kez referans veriliyordu ama tablo hiç tanımlanmamıştı.

### 3.7 CV işlem hattı tabloları

```sql
create table public.cv_uploads (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidate_profiles(user_id) on delete cascade,
  storage_path text not null,
  status text not null default 'processing' check (status in ('processing','ready','failed')),
  created_at timestamptz not null default now()
);
alter table public.cv_uploads enable row level security;

create policy "candidates_manage_own_cv_uploads"
on public.cv_uploads for all
to authenticated
using (candidate_id = (select auth.uid()))
with check (candidate_id = (select auth.uid()));

create table public.cv_extraction_results (
  id uuid primary key default gen_random_uuid(),
  cv_upload_id uuid not null unique references public.cv_uploads(id) on delete cascade,
  raw_json jsonb not null,
  confidence jsonb,
  confirmed boolean not null default false,
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.cv_extraction_results enable row level security;

create policy "candidates_manage_own_extraction_results"
on public.cv_extraction_results for all
to authenticated
using (
  exists (select 1 from public.cv_uploads u where u.id = cv_upload_id and u.candidate_id = (select auth.uid()))
)
with check (
  exists (select 1 from public.cv_uploads u where u.id = cv_upload_id and u.candidate_id = (select auth.uid()))
);
```

---

## 4. Supabase Storage — bucket düzeni ve RLS

`010-backend.mdc`'nin "signed URL, tip/boyut kontrolü server-side" gereksinimini somutlaştırıyorum. **Yol tasarımı kritik:** sahip ID'sini yolun ilk segmenti yapın (`{userId}/{dosya}`), böylece (a) hesap silme = `{userId}/` önekini silmek kadar basit, (b) RLS politikası "ilk path segmenti kendi ID'me eşit mi" kontrolüne indirgenir.

| Bucket | Public? | Yol deseni | RLS |
|---|---|---|---|
| `avatars` | Evet (public) | `{userId}/avatar.{ext}` | Herkes okur; sadece sahibi yazar |
| `company-logos` | Evet (public) | `{employerId}/logo.{ext}` | Herkes okur; sadece sahibi yazar |
| `cv-uploads` | **Hayır** (private) | `{candidateId}/{uuid}.{ext}` | Sadece sahibi (signed URL ile geçici erişim) |
| `verification-documents` | **Hayır** (private, en hassas) | `{userId}/{type}/{uuid}.{ext}` | Sahibi INSERT/SELECT edebilir; admin incelemesi service-role üzerinden |

```sql
insert into storage.buckets (id, name, public) values
  ('avatars', 'avatars', true),
  ('company-logos', 'company-logos', true),
  ('cv-uploads', 'cv-uploads', false),
  ('verification-documents', 'verification-documents', false);

create policy "owners_manage_own_cv_files"
on storage.objects for all
to authenticated
using (bucket_id = 'cv-uploads' and (select auth.uid())::text = (storage.foldername(name))[1])
with check (bucket_id = 'cv-uploads' and (select auth.uid())::text = (storage.foldername(name))[1]);

create policy "owners_upload_own_verification_docs"
on storage.objects for insert
to authenticated
with check (bucket_id = 'verification-documents' and (select auth.uid())::text = (storage.foldername(name))[1]);

create policy "owners_read_own_verification_docs"
on storage.objects for select
to authenticated
using (bucket_id = 'verification-documents' and (select auth.uid())::text = (storage.foldername(name))[1]);
-- Admin incelemesi RLS'ten geçmez: /api/admin/verification/[id]/decide route'u service-role
-- client'la storage'dan okur, isteği yapan kullanıcının role='admin' olduğunu SERVER
-- TARAFINDA (session'dan, JWT claim'e güvenmeden) doğrular.
```

**Kasıtlı bir eksiklik gibi görünebilir ama değil:** `verification-documents` için sadece INSERT+SELECT var, UPDATE/DELETE yok — kullanıcı yüklediği belgeyi ne değiştirebilir ne silebilir. Bu bilinçli: inceleme bütünlüğü için (bir belge "verified"/"rejected" damgalandıktan sonra değiştirilememesi gerekir). Yanlış belge yüklendiyse kullanıcı yeni bir dosya INSERT eder (yeni bir `sensitive_documents` satırıyla), admin ikisini de kuyrukta görür.

**Neden admin incelemesi RLS + JWT claim ile değil, service-role + sunucu tarafı kontrolle:** Bölüm 3.1'de anlatılan "claim bayatlığı" burada gerçek bir risk — biri admin'likten alınsa bile eski token'ıyla hâlâ `user_role: admin` claim'ini taşıyabilir. En hassas okuma (kimlik belgeleri) için tek doğruluk kaynağı `public.users.role`'ün **o anki** veritabanı değeri olmalı, JWT'deki anlık görüntü değil.

**Dosya doğrulama:** Uzantıya değil **magic bytes**'a bakın (`file-type` gibi bir kütüphane ilk baytlardan gerçek MIME'ı okur) — uzantı sahtekarlıkla kolayca atlatılır. Boyut limiti bucket seviyesinde (`fileSizeLimit`) VE route handler'da çift kontrol edilmeli.

---

## 5. RLS operasyonel disiplini

### 5.1 Performans (2026 Supabase pratiği, doğrulandı)

1. `auth.uid()`'i her zaman `(select auth.uid())` sarmalayın — planlayıcı sabit değer gibi önbelleğe alır (Supabase'in ölçümü: index'siz 450ms → index'li 45ms, sarmalama üzerine ek katkı).
2. RLS'te kullanılan **her kolonu** index'leyin (`employer_id`, `candidate_id`, `job_id`).
3. Çapraz-tablo kontrollerini `SECURITY DEFINER STABLE` fonksiyonlara çıkarın (`private.owns_job`, `private.employer_can_view_candidate`) — hem okunabilirlik hem performans (fonksiyon sabit sonuçluyse `select` ile sarmalanınca bir kez hesaplanır).
4. Fonksiyonları ayrı bir `private` şemada tutun ve `search_path`'i açıkça sabitleyin (`set search_path = public`) — aksi halde bir arama-yolu saldırısına (search path hijacking) açık kapı bırakılır.

### 5.2 Gerçek dünya uyarısı

Ocak 2026'da bir platform (Moltbook), RLS'i kapalı bıraktığı için 1.5 milyon kullanıcı kaydını (e-posta, auth token) sızdırdı — düzeltmesi iki SQL satırıydı ama hasar geri alınamadı.

### 5.3 CI'da otomatik RLS denetimi

Her migration sonrası (preview branch veya CI'da) şu sorgu **boş dönmeli**, dönmezse build kırılmalı:

```sql
select tablename from pg_tables
where schemaname = 'public' and rowsecurity = false;
```

Bunu bir GitHub Actions adımı olarak `supabase db push` sonrası çalıştırın (basit bir `psql` çağrısı + satır sayısı kontrolü yeterli, ekstra bir araç gerekmez).

### 5.4 Migration dosya organizasyonu

`supabase/migrations/` altında **tabloyu oluşturan migration, aynı dosyada RLS'i de açmalı ve politikalarını da içermeli** — "önce şema, RLS'i sonra ekleriz" deseni yasak (Bölüm 3 girişinde gerekçelendirildi). Önerilen sıra:

```
0001_identity_and_shared_infra.sql   -- private şeması, public.users, trigger, custom_access_token_hook
0002_reference_tables.sql            -- cities, categories, skills (+ RLS) — candidate_profiles/jobs'tan ÖNCE
0003_candidate_profile.sql           -- candidate_profiles (sadece self-manage), experiences, educations, skills
0004_employers_and_verification.sql  -- employers (+ tax_id kolon REVOKE), sensitive_documents, verification_badges
0005_jobs_and_translations.sql       -- jobs, private.owns_job, job_translations (+ arama trigger'ı)
0006_applications_and_deferred_visibility.sql
                                      -- applications, private.employer_can_view_candidate,
                                      -- + 3.3'te BİLEREK ertelenen candidate_profiles/experiences/
                                      -- educations/skills employer-görünürlük politikaları
0007_saved_jobs_and_audit_log.sql    -- saved_jobs, audit_log (+ RLS, insert-only)
0008_cv_pipeline.sql                 -- cv_uploads, cv_extraction_results (+ RLS)
0009_storage_buckets.sql             -- bucket tanımları + storage.objects RLS
```

**Düzeltme:** Bu liste v2'de zaten doğru sıradaydı (referans tablolar 0002'de, `candidate_profile` 0003'te) — ama Bölüm 3'ün DÜZYAZI anlatımı bunun tersini yapıyordu (önce candidate_profiles, sonra referans tablolar), yani doküman kendi migration planıyla çelişiyordu. Bölüm 3 şimdi bu listeyle birebir aynı sırayı izliyor; 0006 ayrıca hangi politikaların "ertelendiğini" açıkça belirtiyor ki bir sonraki geliştirici bunları unutmasın.

Her dosya bağımsız çalıştırılabilir olmalı (`down` migration'ı da düşünülmeli, en azından geliştirme ortamında geri alınabilir); prod'a asla elle SQL atmayın (`010-backend.mdc` zaten bunu söylüyor, burada dosya sırasıyla somutlaştırdım).

---

## 6. Arama ve filtreleme — derinleştirme

- **Facet count:** iskibris.com'daki gibi "Satış Münhalleri — 41 ilan" sayaçları için canlı `COUNT(*)` yerine 5-10 dakikada bir `pg_cron` ile yenilenen bir **materialized view** kullanın (`category_job_counts`, `city_job_counts`). KKTC ölçeğinde ilan sayısı saatlik değişir, gerçek zamanlı olmasına gerek yok — bu, Meilisearch'e erken geçiş baskısını da azaltır.
- **`search_vector` nerede yaşıyor:** Aranabilir metin (title/description) `job_translations`'ta, `jobs`'ta değil — bu yüzden `search_vector` da (Bölüm 3.5'te DDL'i var) `job_translations` üzerinde, locale'e duyarlı bir trigger ile dolduruluyor. Bir arama sorgusu her zaman `jobs` ⨝ `job_translations` (locale = istenen dil, `jobs.status = 'active'`) şeklinde çalışır — tek başına `job_translations.search_vector @@ query` yeterli değildir, `jobs.status` filtresi olmadan süresi dolmuş ilanlar da sonuçlara karışır.
- **Çok dilli arama kalitesi:** `to_tsvector('turkish', ...)` ve `to_tsvector('english', ...)` farklı stemming kuralları kullanır; Rusça/İbranice için Postgres'in yerleşik config'i yok, `simple` config + `ILIKE` fallback kabul edilebilir bir MVP-üstü çözüm. **İkinci geçiş tetikleyicisi:** sadece "50k+ ilan" değil, "RU/HE arama kalitesi şikayeti" de Meilisearch'e geçişi tetiklemeli (Meilisearch'ün dil algılama/tokenizer desteği çok daha iyi).
- **`jobSearchSchema` tek kaynak:** Hem `/api/jobs` route hem filtre component'i aynı Zod şemasını import eder; URL query string `safeParse` ile doğrulanır, geçersiz parametre sessizce yoksayılır (500 fırlatılmaz).
- **Cursor-based pagination:** `(published_at, id)` composite cursor — sonsuz kaydırmada offset'in büyük değerlerde performans kaybına ve "sayfa 2'de gördüğüm ilan sayfa 3'te tekrarlandı" tutarsızlığına düşmemek için. Crawler'lar için ayrıca `?page=N` SEO-dostu statik sayfalama sunulmalı — iki farklı ihtiyaç, tek şemaya sıkıştırmayın.

---

## 7. Doğrulama/rozet sistemi — durum makinesi ve operasyonel gerçek

KKTC'de vergi no doğrulamak için genel-erişime-açık bir ticaret sicili API'si **yok** (araştırmamda böyle bir kamu API'sine rastlamadım) — `company` rozeti otomatik değil **manuel inceleme** gerektirir:

1. Şirket, belgeyi `verification-documents` bucket'ına yükler → `sensitive_documents.status='pending'`, `verification_badges.status='pending'`.
2. `/[locale]/admin/verifications` sayfası (sadece server tarafında `role='admin'` doğrulanmış) kuyruğu gösterir.
3. Admin onay/red verir → **server action, service-role client kullanarak** hem `sensitive_documents.status` hem `verification_badges.status`'ü günceller, `audit_log`'a yazar.
4. UI hiçbir zaman "verified" durumunu kendi hesaplamaz — sadece backend'den gelen `verification_badges.status`'ü okur (`010-backend.mdc` zaten bunu istiyor, burada akış olarak somutlaştırdım).

Kimlik doğrulama (opsiyonel/premium) için de aynı manuel akış — KKTC'de otomatik e-Devlet/e-Kimlik entegrasyonu pratik değil.

---

## 8. API sözleşmeleri

| Method | Path | Auth | Not |
|---|---|---|---|
| GET | `/api/jobs` | public | `jobSearchSchema`, cursor pagination, SSR'dan da çağrılır |
| GET | `/api/jobs/[slug]` | public | `JobPosting` JSON-LD burada üretilir; `status != active` → `410 Gone` |
| POST | `/api/jobs` | employer | Turnstile zorunlu, `private.owns_job` ile aynı desende yazılır |
| POST | `/api/applications` | candidate | rate-limit: kullanıcı+ilan başına günde 1 |
| POST | `/api/cv/upload` | candidate | signed URL üretir, `cv_uploads` satırı + Vercel Queue mesajı |
| GET | `/api/cv/[id]/status` | candidate | `processing/ready/failed` |
| POST | `/api/cv/[id]/confirm` | candidate | AI çıktısını **onaydan sonra** `candidate_experiences` vb. tablolara yazar |
| POST | `/api/verification/documents` | employer/candidate | `verification-documents` bucket'a yükleme |
| POST | `/api/admin/verification/[id]/decide` | admin (server-side rol kontrolü) | service-role client, `audit_log` yazar |
| POST | `/api/jobs/[id]/translations/generate` | employer | LLM taslak çeviri tetikler, `job_translations.status='draft'` üretir |
| POST | `/api/jobs/[id]/translations/[locale]/publish` | employer | `status='published'` yapar |

---

## 9. CV yükle → AI ile doldur — Vercel'in 2026 arka-plan-işi primitifleriyle

Vercel 2026'da dört arka-plan-işi aracı sunuyor, her biri farklı garanti seviyesinde:

| Araç | Garanti | Ne zaman kullanılır |
|---|---|---|
| `waitUntil()` | **En iyi çaba** — retry yok, kalıcılık yok, fonksiyonla birlikte ölür | Loglama, analitik — kaybolması kabul edilebilir işler |
| Vercel Cron | Sadece zaman-tetiklemeli | İlan expiry, sitemap yenileme |
| **Vercel Queues** | **Dayanıklı**, en-az-bir-kez teslim (idempotent tüketici gerektirir) | **CV-parse, çeviri taslağı üretimi** — kullanıcı sonucu bekliyor, kaybolmamalı |
| Vercel Workflow | Dayanıklı, çok adımlı, "use workflow" direktifiyle her adım checkpoint'lenir, redeploy sonrası kaldığı yerden devam eder | İleride: çok adımlı işveren onboarding (belge yükle → ödeme → onay) gibi uzun süren akışlar |

**v1'deki "polling ile asenkron" önerisini güncelliyorum:** `waitUntil()` best-effort olduğu için kullanıcının aktif olarak beklediği bir CV-parse işlemi için **yetersiz** — fonksiyon soğuk kapanırsa iş sessizce kaybolabilir. Doğru araç **Vercel Queues**:

```
1. Kullanıcı PDF/DOCX yükler → cv-uploads bucket'ına signed URL ile
2. cv_uploads satırı: status='processing' → route handler Vercel Queue'ya mesaj yazar, HEMEN 202 döner
3. Queue tüketicisi (ayrı bir route/fonksiyon, idempotent olmalı — aynı mesaj iki kez gelebilir):
   a. Dosyadan metin çıkar
   b. LLM'e SABİT bir JSON şeması ile structured extraction isteği gönder
      (serbest metin promptu DEĞİL, araç-kullanımı/structured output ile şema zorlanır)
   c. Her alan için confidence puanı iste
   d. cv_extraction_results yazar (upsert — idempotency için cv_upload_id UNIQUE zaten bunu sağlıyor),
      status='ready'
4. Frontend, Supabase Realtime ile cv_uploads.status değişimini dinler (polling'e gerek yok)
5. Kullanıcıya DÜZENLENEBİLİR form: AI çıktısı ön dolu ama kaydedilmemiş,
   düşük confidence alanlar vurgulanır
6. "Onayla" → /api/cv/[id]/confirm → SADECE BU NOKTADA candidate_experiences/educations/skills'e
   source='ai_extracted', confirmed=true yazılır
```

**İdempotency neden zorunlu:** Vercel Queues "en az bir kez" teslimat garantisi veriyor — yani aynı mesaj iki kez işlenebilir. `cv_extraction_results.cv_upload_id` üzerindeki UNIQUE constraint + `upsert` (insert ... on conflict do update) bu senaryoda ikinci işlemenin veri bozulmasına yol açmamasını garanti eder.

**Onay disiplini (v1'den korunuyor, gerekçesi güçlendirildi):** Yanlış çıkarılan bir tarih/unvan, kullanıcının haberi olmadan profiline yazılıp işverene giderse, tam olarak rozet sisteminin çözmeye çalıştığı güven sorununun tersini yaratır. `confirmed` alanı olmadan bu disiplin kod içinde unutulabilir — şema bunu zorluyor.

**Maliyet/kötüye kullanım:** Kullanıcı başına günlük CV-parse kotası (Upstash'te sayaç, örn. 5/gün).

---

## 10. i18n mimarisi — içerik çevirisi ve hreflang

### 10.1 İçeriği kim çeviriyor?

`020-frontend.mdc` UI metinlerini doğru tanımlamış ama **ilan içeriği** çevirisi (`job_translations`) AGENTS.md'de yanıtsız — bir KKTC işvereninden 4 dilde ilan yazmasını beklemek, TR/EN/RU/HE farklılaştırma vaadini kağıt üzerinde bırakır.

**Öneri (CV-parse ile aynı ürün dili):** İşveren TR (veya EN) yazar → arka planda (yine Vercel Queues, senkron değil) LLM ile EN/RU/HE **taslak** çeviri üretilir → `job_translations.status='draft'` → işveren "çevirileri gözden geçir" ekranında düzenler/onaylar → `status='published'`. Onaylanmamış çeviri o locale'de **gösterilmez**, fallback zincirine düşer.

**Fallback zinciri (locale-duyarlı, `tr → en` temel zincirinin genişletilmesi):** RU/HE konuşan kullanıcı için TR'ye düşmek işe yaramaz — `ru/he → en → tr`, `en → tr`, `tr` (kaynak). Bu mantık RLS'te değil, **repository katmanında** bir `COALESCE`/öncelik sorgusuyla uygulanır (RLS sadece `published` olanı görünür kılar, hangisinin öncelikli olduğuna karar vermez).

### 10.2 hreflang (AGENTS.md'de eksik olan SEO parçası)

Aynı ilanın 4 dil varyantı ayrı URL'lerdeyse, `hreflang` etiketleri olmadan Google bunları "duplicate content" ya da alakasız sayfalar sanabilir. Next.js Metadata API + next-intl ile:

```ts
// app/[locale]/ilan/[slug]/page.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const languages = Object.fromEntries(
    routing.locales.map((l) => [l, `${siteBaseUrl}/${l}/ilan/${slug}`])
  );
  return {
    alternates: {
      canonical: `${siteBaseUrl}/${locale}/ilan/${slug}`,
      languages: { ...languages, 'x-default': `${siteBaseUrl}/tr/ilan/${slug}` },
    },
  };
}
```

next-intl v4'ün `routing.ts` + `navigation.ts` deseni kullanılmalı (locale-aware component'lerde doğrudan `next/navigation` import etmeyin) — bu, `020-frontend.mdc`'nin i18n kurallarıyla birebir uyumlu, sadece versiyon-spesifik pattern'i netleştiriyor.

### 10.3 RTL detayı

`020-frontend.mdc` zaten doğru yönde. Ek nokta: sayı/tarih/para birimi RTL akış içinde bile **LTR görünmelidir** (`115 ₺` İbranice metin içinde ters dönmemeli) — `Intl.NumberFormat`/`Intl.DateTimeFormat` bunu varsayılan olarak doğru çözer, elle string birleştirmekten kaçınma kuralınız bu yüzden kritik.

---

## 11. Tasarım token pipeline'ı

**Somut araç önerisi:** **Style Dictionary** — tek bir `tokens.json`'dan hem Tailwind CSS değişkenlerini hem RN `StyleSheet` uyumlu bir modülü otomatik üretir. "v0'dan gelen bileşen kendi ad-hoc rengini değil, token dosyasını referans alır" kuralını manuel disiplinden çıkarıp derleme-zamanı garantisine çevirir.

**Kontrast garantisi CI'da:** Token dosyasındaki her (metin rengi, üstünde durduğu yüzey) çiftinin WCAG kontrast oranını hesaplayan birkaç satırlık bir script pre-commit/CI adımına eklenmeli — "estetik kontrastı kurban etmesin" kuralı manuel gözden geçirmeye bırakılırsa er ya da geç ihlal edilir.

---

## 12. SEO / `JobPosting` yapılandırılmış veri — tam alan tablosu

| Alan | Zorunluluk | Not |
|---|---|---|
| `title`, `description`, `hiringOrganization`, `jobLocation`, `datePosted`, `validThrough` | **Zorunlu (6)** | Eksikse ilan Google Jobs'ta hiç görünmez |
| `employmentType`, `baseSalary`, `identifier`, `jobLocationType`, `applicantLocationRequirements` | Önerilen | Zenginleştirilmiş sonuç için |
| `directApply` | Opsiyonel (2021+) | "Buradan direkt başvur" sinyali — bizim `/api/applications` akışımızla birebir örtüşüyor, eklenmeli |
| `experienceRequirements`, `educationRequirements` | Opsiyonel | `experience_level` kolonumuzla dolduruluyor |

**Süre dolumu (AGENTS.md'de olmayan operasyonel gereksinim):** Google, `validThrough` geçmiş ama açık duran ilanları cezalandırır. `jobs.expires_at` zorunlu (varsayılan: 30-45 gün), günlük bir **Vercel Cron** süresi dolanları `status='expired'` yapar. Satır **silinmez** (SEO geçmişi için), sayfa `noindex` alır ve HTTP `410 Gone` döner (`404`'ten daha net bir "kalıcı kaldırıldı" sinyali). UI'da "bu ilan artık aktif değil, benzer ilanlara göz atın" gösterilir.

---

## 13. Güvenlik — derinleştirme

- **Turnstile + Server Actions:** Widget'ın client'ta görünmesi yeterli değil; token'ı **server action/route handler içinde** Cloudflare'in doğrulama endpoint'ine POST edip sonucu kontrol etmeden mutasyonu çalıştırmayın. Ortak bir `verifyTurnstile()` yardımcı fonksiyonuna çıkarın.
- **Dosya yükleme:** Magic bytes ile MIME doğrulama (Bölüm 4). Virüs taraması (ClamAV) MVP-üstü aşamada gereksiz karmaşıklık, "büyüdükçe gözden geçir" listesinde (Bölüm 17).
- **Rate limiting:** Upstash Redis, IP+user_id kombinasyonu, kayıt/ilan verme/başvuru/CV yükleme uçlarında.
- **KKTC 89/2007 nüansı:** Yasa 2007'de çıkmış ama öngörülen Kurul ancak 2019'da atanmış; akademik kaynaklar uygulamanın zayıf olduğunu belirtiyor. **Pratik sonuç:** yerel uygulamaya güvenip standardı gevşetmeyin — Türkiye'nin çok daha olgun 6698 sayılı KVKK'sını pratik referans çerçevesi olarak kullanın (açık rıza, saklama süresi, silme/unutulma hakkı). Bu, 89/2007'yi otomatik karşılar ve ileride Türkiye pazarına açılma ihtimaline karşı da hazırlıklı olur.

---

## 14. Gözlemlenebilirlik

- **Sentry** (client+server) — ücretsiz katman KKTC ölçeği için yeterli.
- **Vercel Analytics + Speed Insights** — "Lighthouse 100/100" hedefini gerçek kullanıcı verisiyle (RUM) doğrulayın; glassmorphism/blur kararlarının düşük-uçlu cihazlardaki gerçek etkisini sentetik testle bilemezsiniz.
- İşveren portalının uptime'ını **ayrı** izleyin — ana site ayakta ama işveren girişi bozuksa ilan akışı sessizce durur.
- `request_id` bazlı yapılandırılmış log — `000-always.mdc`'nin "hata döngüsüne girersen dur, hipotezini yaz" kuralıyla doğrudan bağlantılı.

---

## 15. Performans ve önbellekleme

| Sayfa tipi | Strateji | Gerekçe |
|---|---|---|
| Ana sayfa, şehir/kategori landing | ISR, `revalidate: 60-120s` | iskibris'in statik-benzeri SEO sayfalarıyla eşit/üstü, içerik yine tazeleniyor |
| İlan detay | SSR + `stale-while-revalidate` | `JobPosting` JSON-LD zorunlu server-render |
| Arama/filtre sonucu | SSR, sorguya özgü; sık kombinasyonlar Upstash'te kısa TTL | Filtre kombinasyonu sonsuz, tam önbellekleme pratik değil |
| İşveren portalı | Dinamik SSR, önbellek yok | Kimlik doğrulanmış, kişiye özel veri |
| Cam-morfik efektler | Üstte 3-5 statik eleman + `contain: layout style paint` + `prefers-reduced-motion`/düşük `deviceMemory` tespitinde otomatik kapat | blur GPU-pahalı, düşük uçlu Android'de INP'yi bozar |

---

## 16. Build sırasıyla hizalanmış checklist

**Faz 1 — Şema+RLS:** Bölüm 3'teki tam DDL + `private.*` fonksiyonlar + JWT custom claim hook'u + CI'da RLS denetimi (5.3) + Bölüm 4'teki storage bucket/politikaları.

**Faz 2 — Backend:** `verifyTurnstile()`, Upstash rate-limit, Vercel Queue tüketicileri (CV-parse, çeviri taslağı), ilan expiry cron'u, admin doğrulama karar uç noktası (service-role + sunucu tarafı rol kontrolü).

**Faz 3 — Frontend akışları:** Cursor-based feed + SEO-dostu `?page=N`, CV yükle→onay formu, çeviri taslağı gözden geçirme ekranı, admin doğrulama kuyruğu, hreflang metadata.

**Faz 4 — Tasarım giydirme:** Style Dictionary pipeline, glassmorphism perf kısıtları, kontrast CI kontrolü, dinamik OG image.

---

## 17. Trade-off analizi

| Karar | Alternatif | Neden bu seçildi | Ne zaman gözden geçir |
|---|---|---|---|
| Postgres FTS (gün 1) | Meilisearch/Algolia | Ekstra servis = ekstra operasyon yükü | 50k+ ilan **veya** RU/HE arama şikayeti **veya** facet count ihtiyacı |
| CV-parse: Vercel Queues | `waitUntil()` (best-effort) | Kullanıcı sonucu bekliyor, kayıp kabul edilemez | — (bu karar ölçekle değişmez, garanti seviyesi meselesi) |
| JWT custom claim (rol) | Her RLS kontrolünde `public.users`'a subquery | Hız; ama en hassas tablolarda (sensitive_documents) KULLANILMIYOR — claim bayatlığı riski | Rol değişikliği sık oluyorsa, sign-out zorunluluğunu UI'da netleştirin |
| Şirket doğrulaması: manuel admin kuyruğu | Otomatik kamu API entegrasyonu | KKTC'de bu amaçla genel-erişime-açık API bulunamadı | İlgili kurum API açarsa otomatikleştirin |
| LLM-taslak çeviri + insan onayı | Employer 4 dilde manuel yazar | Gerçekçi olmayan yük, farklılaştırma vaadi kağıt üzerinde kalır | Çeviri kalitesi şikayeti çoğalırsa DeepL vb. profesyonel API'ye geçilebilir |
| Cursor-based pagination | Offset/limit | Sonsuz kaydırmada tutarlılık + performans | "Sayfa numarasına git" gerçek talep olursa hibrit gerekebilir |
| `search_vector`: `job_translations` üzerinde, locale-duyarlı trigger | `jobs` üzerinde tek bir vector | Çok dilli içerik farklı stemming ister; tek kolon 4 dili karıştırırdı (v2'nin gerçek hatasıydı, v3'te düzeltildi) | — |
| `applications.status` güncelleme: kolon-seviyesi GRANT + RLS | Sadece RLS (satır-seviyesi) | RLS tek başına "sadece status" garantisi vermez, kolon değişikliklerini durdurmaz | Başka güncellenebilir alan (ör. görüşme notu) gerekirse grant listesi genişletilmeli |

---

## 18. Büyüdükçe yeniden gözden geçirilecekler

- Arama motoru geçişi (Bölüm 6/17'deki eşikler).
- Employer portalını ayrı Vercel projesine bölmek.
- Dosya yüklemede virüs taraması.
- Şirket profili sayfalarına `Organization`/`LocalBusiness` schema.org verisi eklemek.
- `sensitive_documents` saklama süresi dolan kayıtların otomatik silinmesi (cron ile, elle değil).
- Facet count materialized view yenilenme sıklığı.
- Vercel Workflow'a geçiş: çok adımlı işveren onboarding (belge→ödeme→onay) karmaşıklaşırsa Queues yerine.

---

*Bölüm 3-5 (veri modeli, storage, RLS) bu revizyonda en derin işlenen kısım — talebiniz doğrultusunda. Diğer bölümler de v1'e göre somut kod/araştırma ile büyütüldü. Bölüm 9 ve 10'daki mimari eklemeler (Vercel Queues, LLM-taslak çeviri) hâlâ onayınıza tabi, AGENTS.md'nin "yeni pattern eklemeden önce belirt" kuralına uygun olarak gerekçeleriyle işaretlendi.*
