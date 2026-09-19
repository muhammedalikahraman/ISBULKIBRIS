# İşBulKıbrıs — Veri katmanı

Bu klasör uygulamanın **tek veri sözleşmesidir**. UI, sahte ilan, mock API veya “çalışan demo” yoktur. Değişiklik yüzeyi: seed JSON, `coded_values` satırı, `product_settings` veya yeni bir domain klasörü.

Üst seviye sistem notları `ISBULKIBRIS_SISTEM_TASARIMI.md` içindedir. **Şema gerçeği** burası ve `supabase/migrations/` dosyalarıdır. v3’teki gömülü `CHECK (locale in …)` / `name_tr, name_en…` kolonları bilinçli olarak bırakıldı: dil ve durum eklemek migration değil veri işidir.

## Sınırlı bağlamlar

| Klasör | Sorumluluk | Dışarıya sızmayan |
|---|---|---|
| `kernel` | locale, coded_values, settings, audit, outbox, `updated_at` | — |
| `catalog` | şehir, bölge, kategori, beceri + çeviri satırları | iş ilanı metni yok |
| `identity` | `users`, `user_roles` | şirket veya CV yok |
| `organizations` | şirket, üyelik, yetki | başvuru yok |
| `candidates` | profil, deneyim, eğitim, beceri bağı | işveren tax_id yok |
| `jobs` | ilan, çeviri, ilan-beceri, arama vektörü | başvuru yok |
| `cv` | yükleme (başvuru FK’sinden **önce**) | extraction onayı profil yazmaz |
| `applications` | başvuru, kayıtlı ilan, işveren-aday görünürlüğü | belge inceleme yok |
| `verification` | belge + rozet; yazma service-role | — |
| `search` | facet materialized view tanımları | yazma yok |

Uygulama katmanı yalnızca `src/repositories` portlarından okur/yazar. SQL istemcisi sayfada veya route handler içinde dağılmaz.

## Nasıl güncellenir

| İhtiyaç | Ne yapılır | Ne yapılmaz |
|---|---|---|
| Yeni dil (`el`) | `locales` + her çeviri tablosuna satır; `src/kernel/locale.ts` | `ALTER … ADD name_el` |
| Yeni şehir / kategori / beceri | `data/seed/*.json` → `npm run sync-seed` | Kodda dizi hardcode |
| Yeni istihdam türü | `coded_values` (`employment_type`) + çeviri | `CHECK` genişletme |
| İlan süresi, CV kotası | `product_settings` | Deploy’a gömülü sabit (okuma TS sabitinden key ile) |
| Yeni filtre özelliği | `job_attributes` + `coded_values` kind | `jobs` tablosuna rastgele kolon |
| Yeni asenkron iş | `domain_outbox.event_type` | Tabloya kuyruk kolonları eklemek |
| Şirkete ikinci kullanıcı | `organization_members` | `jobs.user_id` taşımak |

## v3’e göre bilinçli sapmalar

1. **Dil kolonları yok** — `*_translations(locale, …)` ; RLS ve FTS locale satırında kalır.
2. **Tek rol kolonu yetmez** — `user_roles` çoklu rol. Yetki JWT claim’e değil `user_roles` / service-role’a bakar (`custom_access_token_hook` kaldırıldı).
3. **İşveren = kullanıcı değildi, kırılgandı** — `organizations` + üyeler. İlan `organization_id` taşır.
4. **`applications.cv_snapshot_id` FK sırası** — `cv_uploads` başvurulardan önce yaratılır (v3’te 0008’de tanımlı tabloya 0006’dan FK vardı; çalışmazdı).
5. **Durumlar lookup** — `coded_values`; `is_active=false` ile emekli edilir, satır silinmez.
6. **Outbox** — CV-parse ve çeviri taslağı kuyruğu şemadan bağımsız tüketilir.

## Değişmezler (kod + RLS birlikte)

- Her `public` tabloda RLS açık; CI sorgusu boş dönmek zorunda.
- `auth.uid()` her politikada `(select auth.uid())`.
- Çapraz tablo: `private.*` `SECURITY DEFINER STABLE`, `search_path` kilitli.
- `sensitive_documents` ve `audit_log`: politika yok, yalnızca service-role.
- `organizations.tax_id` / `verification_source`: kolon `REVOKE`.
- `applications`: authenticated yalnızca `status` günceller (kolon GRANT).
- CV extraction profil tablolarına **yalnızca confirm** sonrası yazılır (`source = ai_extracted`).
- Yayınlanmamış çeviri public okunmaz; parent job `active` değilse çeviri de public değil.
- Katalog yazımı admin (`user_roles`).

## Migration sırası

`supabase/migrations/` dosya adları sırayı kilitler. Yeni tablo, **aynı dosyada** RLS açar. Başka tabloya bağlı politika ertelenir ve dosya adında `deferred` geçer.

## Okuma yolu (uygulama)

```
Route / Server Component
  → lib/server/services/*     (henüz yok; bu paket port tanımlar)
  → CatalogRepository, JobRepository, …
  → Supabase (RLS’li user client veya service-role)
```

Port imzaları `src/repositories/ports.ts`. Sahte implementasyon yok.
