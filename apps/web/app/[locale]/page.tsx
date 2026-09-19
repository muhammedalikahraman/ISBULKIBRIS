import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { hreflangMap, localeUrl } from "@/lib/site";
import { CategoryCard, CyprusMap, HomeSearch, PopularLink } from "./home-client";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "site" });
  const canonicalUrl = localeUrl(locale);
  return { title: t("name"), description: t("tagline"), keywords: ["Kuzey Kıbrıs iş ilanları", "Girne iş", "Lefkoşa kariyer", "Kıbrıs iş bul"], alternates: { canonical: canonicalUrl, languages: hreflangMap() }, openGraph: { type: "website", url: canonicalUrl, title: t("name"), description: t("tagline"), siteName: t("name") } };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("site");
  const tNav = await getTranslations("nav");
  const tHome = await getTranslations("home");

  return <div className="home-shell">
    <section className="hero-section" aria-labelledby="home-title">
      <div className="hero-copy">
        <p className="eyebrow"><span className="eyebrow-dot" /> KUZEY KIBRIS&apos;IN YENİ KARİYER AĞI</p>
        <h1 id="home-title">Kariyerinin<br /><em>yeni yönünü</em><br />bul.</h1>
        <p className="hero-lede">Doğru fırsat, doğru şehir, doğru zaman. Kıbrıs&apos;ın yükselen ekipleri ve yetenekleri tek bir yerde buluşuyor.</p>
        <HomeSearch locale={locale} labels={{ queryPlaceholder: "Pozisyon, beceri veya şirket ara", cityPlaceholder: "Şehir seç", search: "İlan ara" }} />
        <div className="hero-trust"><span className="trust-avatars"><i>A</i><i>N</i><i>İ</i></span><span>Her gün yeni fırsatlar ekleniyor</span><b>✦</b><span>Güvenli ve ücretsiz</span></div>
      </div>
      <div className="hero-visual"><div className="visual-sheen" /><div className="visual-grid" aria-hidden="true" /><CyprusMap locale={locale} /><div className="floating-note note-top"><span>●</span><div><strong>Güncel</strong><small>yeni fırsatlar</small></div></div><div className="floating-note note-bottom"><span>↗</span><div><strong>Yerel ağ</strong><small>tek platformda</small></div></div><div className="visual-caption">KIBRIS<br /><strong>İÇİN TASARLANDI</strong></div></div>
    </section>

    <section className="section-block" id="ilanlar" aria-labelledby="categories-title">
      <div className="section-heading"><div><p className="eyebrow">KEŞFETMEYE BAŞLA</p><h2 id="categories-title">Sana uygun alanı<br /><em>yakala.</em></h2></div><Link href="/ilanlar" className="text-link">Tüm ilanları gör <span aria-hidden="true">↗</span></Link></div>
      <div className="category-grid"><CategoryCard title="Teknoloji" count="Fırsatları keşfet" accent="#6d5dfc" icon="⌘" /><CategoryCard title="Turizm & Otelcilik" count="Fırsatları keşfet" accent="#ed8c52" icon="✦" /><CategoryCard title="Satış & Pazarlama" count="Fırsatları keşfet" accent="#3ca995" icon="↗" /><CategoryCard title="Finans & Yönetim" count="Fırsatları keşfet" accent="#ce6688" icon="◒" /></div>
    </section>

    <section className="discover-strip" aria-labelledby="discover-title"><div><p className="eyebrow">BUGÜNÜN SEÇKİSİ</p><h2 id="discover-title">Aradığın fırsat<br /><em>burada olabilir.</em></h2></div><div className="discover-stats"><div><strong>Yerel</strong><span>iş fırsatları</span></div><div><strong>Canlı</strong><span>ilan akışı</span></div><div><strong>Ücretsiz</strong><span>keşif deneyimi</span></div></div><div className="popular"><span>Popüler aramalar</span><PopularLink>Otelcilik</PopularLink><PopularLink>Satış</PopularLink><PopularLink>Yazılım</PopularLink><PopularLink>Uzaktan</PopularLink></div></section>

    <section className="employer-banner"><div><p className="eyebrow">YETENEK ARAYANLAR İÇİN</p><h2>Ekibine doğru kişiyi<br /><em>kat.</em></h2></div><p>Kıbrıs&apos;ın en iyi yeteneklerine ulaş. İlanını yayınla, ekibini büyüt.</p><Link href="/ilanlar" className="dark-button">İşveren alanına git <span aria-hidden="true">↗</span></Link></section>
  </div>;
}
