# İşBulKıbrıs - Kurulum Talimatları

## 🚀 Hızlı Başlangıç

Proje şu an production-ready durumda. İki farklı kurulum yöntemi mevcut:

## 📋 Ön Koşullar

- Node.js 22+
- npm veya yarn
- Supabase hesabı (cloud kullanımı için)

## 🔧 Kurulum Adımları

### 1. Repository Kurulumu

```bash
# Projeyi klonlayın
git clone <repository-url>
cd İŞBULKIBRIS

# Root dependencies kurun
npm install

# Web app dependencies kurun
cd apps/web
npm install
```

### 2. Supabase Database Kurulumu

#### Seçenek A: Dashboard SQL Editor (Önerilen - En Hızlı)

1. [Supabase Dashboard](https://supabase.com/dashboard/project/rpqginxblanrhjjregeb/sql/new) adresine gidin
2. `supabase/migrations/complete_setup.sql` dosyasının içeriğini kopyalayın
3. SQL Editor'da çalıştırın
4. Bu işlem tüm tabloları, fonksiyonları ve politikaları tek seferde oluşturur

#### Seçenek B: Supabase CLI (Gelişmiş Kullanıcılar İçin)

```bash
# Supabase CLI kurulumu
npm install -g supabase

# Supabase access token al
# https://supabase.com/dashboard/account/tokens adresinden token alın

# Login yap
supabase login --token <YOUR_ACCESS_TOKEN>

# Projeyi bağla
supabase link --project-ref rpqginxblanrhjjregeb

# Migration'ları uygula
supabase db push

# Admin e-posta ayarını yap
supabase db execute supabase/snippets/set_admin_email.sql
```

### 3. Environment Variables Yapılandırması

`apps/web/.env.local` dosyasını oluşturun (veya varsa düzenleyin):

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://rpqginxblanrhjjregeb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_reaNA6lJEFPkkHRMFcxjug_Xs9LDk6a
SUPABASE_SERVICE_ROLE_KEY=<DASHBOARD'DAN_ALINAN_SERVICE_ROLE_KEY>

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Security
CRON_SECRET=isbulkibris-secure-cron-secret-2026

# Optional
NEXT_PUBLIC_GOOGLE_VERIFICATION=
NEXT_PUBLIC_RATE_LIMIT_MAX=100
NEXT_PUBLIC_RATE_LIMIT_WINDOW=60000
```

**Önemli Notlar:**
- Service role key'i asla client-side code'da kullanmayın
- Production için güçlü bir `CRON_SECRET` belirleyin
- Service role key'i Supabase Dashboard > Project Settings > API'den alın

### 4. Uygulamayı Başlatma

```bash
cd apps/web
npm run dev
```

Uygulama `http://localhost:3000` adresinde çalışacaktır.

## 🏗️ Build ve Production

### Build İşlemi

```bash
cd apps/web
npm run build
```

### Production Deploy

```bash
cd apps/web
npm run start
```

## 🔐 Güvenlik Ayarları

### Rate Limiting
- Default: 100 istek / 60 saniye
- Environment variables ile özelleştirilebilir
- Tüm API endpoint'lerinde aktif

### Security Headers
- Strict-Transport-Security
- X-Frame-Options
- X-Content-Type-Options
- Referrer-Policy
- X-DNS-Prefetch-Control

### Input Validation
- XSS koruması
- SQL injection koruması
- CSRF koruması
- Rate limiting

## 🎨 Özellikler

### SEO Optimizasyonu
- Gelişmiş meta tag'ler
- OpenGraph ve Twitter Card
- hreflang alternate linkleri
- Schema.org structured data
- Canonical URL'ler

### Performans
- Image optimization (AVIF, WebP)
- Caching sistemi
- Static generation
- Response caching headers
- Runtime cache management

### Güvenlik
- RLS politikaları
- Service role separation
- Input sanitization
- Rate limiting
- Secure headers

### Çoklu Dil
- Türkçe (tr)
- İngilizce (en)
- Rusça (ru)
- İbranice (he)

## 🧪 Test

### Build Test
```bash
cd apps/web
npm run build
```

### Type Check
```bash
cd apps/web
npx tsc --noEmit
```

### RLS Assertion
```bash
node scripts/assert-rls-migrations.mjs
```

## 📊 Monitoring

### Development
- Console logging aktif
- Error messages detaylı
- Performance monitoring

### Production
- Structured error responses
- Error tracking (Sentry vb. önerilir)
- Performance monitoring
- Logging service entegrasyonu

## � Troubleshooting

### Build Hataları
- `npm install` çalıştırın
- Node.js sürümünü kontrol edin (22+)
- Cache'i temizleyin: `rm -rf .next`

### Database Hataları
- Migration'ların başarıyla uygulandığını kontrol edin
- Supabase bağlantı bilgilerini doğrulayın
- RLS politikalarını kontrol edin

### Authentication Hataları
- Supabase Auth ayarlarını kontrol edin
- Email confirmation settings
- Admin bootstrap e-posta'sını doğrulayın

## 📝 Ek Notlar

### Admin Rolü
- Admin e-posta: `admin@isbulkıbrıs.com`
- Bu e-posta ile ilk kayıt olan kullanıcıya otomatik admin rolü verilecek
- Bootstrap mekanizması `handle_new_user()` trigger'ı ile çalışır

### Migration Yapısı
- Tüm migration'lar `complete_setup.sql` içinde birleştirildi
- Sıralı çalıştırılması gerekir
- RLS politikaları her tabloda aktif

### Caching Stratejisi
- Catalog data: 1 saat
- Job listesi: 1 dakika
- Job detail: 5 dakika
- Homepage: 5 dakika

## 🎯 Deployment Platformları

### Vercel (Önerilen)
1. Repository'yi GitHub'a push edin
2. Vercel'e import edin
3. Environment variables'ı ekleyin
4. Deploy edin

### Diğer Platformlar
- Next.js destekleyen herhangi bir platform
- Docker container deployment
- Self-hosted VPS

## 📚 Ek Kaynaklar

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [next-intl Documentation](https://next-intl-docs.vercel.app/)

## ✅ Kurulum Kontrol Listesi

- [ ] Node.js 22+ yüklü
- [ ] Dependencies kurulu
- [ ] Supabase database ayarlandı
- [ ] Environment variables yapılandırıldı
- [ ] Build başarılı
- [ ] Local development çalışıyor
- [ ] Admin rolü test edildi
- [ ] SEO meta tag'leri kontrol edildi
- [ ] Rate limiting aktif
- [ ] Caching sistemi çalışıyor

Proje artık production-ready! 🎉