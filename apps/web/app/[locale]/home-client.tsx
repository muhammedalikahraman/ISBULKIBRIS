"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";

type HomeClientProps = {
  locale: string;
  labels: {
    queryPlaceholder: string;
    cityPlaceholder: string;
    search: string;
  };
};

const cities = ["Girne", "Lefkoşa", "Gazimağusa", "Güzelyurt", "İskele", "Lefke"];

export function HomeSearch({ locale, labels }: HomeClientProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (city) params.set("city", city.toLowerCase());
    router.push(`/ilanlar${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <form className="home-search" onSubmit={submit} aria-label={labels.search}>
      <div className="search-field search-field-wide">
        <span className="field-mark" aria-hidden="true">⌕</span>
        <label htmlFor="job-query" className="sr-only">{labels.queryPlaceholder}</label>
        <input id="job-query" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={labels.queryPlaceholder} />
      </div>
      <div className="search-field">
        <span className="field-mark" aria-hidden="true">⌖</span>
        <label htmlFor="job-city" className="sr-only">{labels.cityPlaceholder}</label>
        <select id="job-city" value={city} onChange={(event) => setCity(event.target.value)}>
          <option value="">{labels.cityPlaceholder}</option>
          {cities.map((item) => <option value={item} key={item}>{item}</option>)}
        </select>
      </div>
      <button className="search-button" type="submit">{labels.search}<span aria-hidden="true">↗</span></button>
    </form>
  );
}

const mapCities = [
  { slug: "lefke", name: "Lefke", x: 76, y: 153 },
  { slug: "guzelyurt", name: "Güzelyurt", x: 133, y: 132 },
  { slug: "girne", name: "Girne", x: 242, y: 91 },
  { slug: "lefkosa", name: "Lefkoşa", x: 238, y: 157 },
  { slug: "gazimagusa", name: "Gazimağusa", x: 365, y: 178 },
  { slug: "iskele", name: "İskele", x: 348, y: 118 },
];

export function CyprusMap({ locale }: { locale: string }) {
  const router = useRouter();
  const [activeCity, setActiveCity] = useState("lefkosa");

  function selectCity(slug: string) {
    setActiveCity(slug);
    window.setTimeout(() => router.push(`/ilanlar?city=${slug}`), 480);
  }

  return <div className={`cyprus-map-shell city-${activeCity}`}>
    <div className="map-heading"><span>ŞEHRİNİ SEÇ</span><strong>Yakınındaki fırsatları keşfet</strong></div>
    <svg className="cyprus-map" viewBox="0 0 470 250" role="img" aria-labelledby="map-title map-description">
      <title id="map-title">Kuzey Kıbrıs şehir haritası</title>
      <desc id="map-description">Girne, Lefkoşa, Gazimağusa, Güzelyurt, İskele ve Lefke şehirlerini seçerek ilanlara ulaşın.</desc>
      <defs><linearGradient id="island-fill" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#ffffff" /><stop offset=".48" stopColor="#d6f3e9" /><stop offset="1" stopColor="#a5d9d1" /></linearGradient><filter id="map-shadow"><feDropShadow dx="0" dy="10" stdDeviation="9" floodColor="#2a786b" floodOpacity=".18" /></filter></defs>
      <path className="island-shape" filter="url(#map-shadow)" d="M35 141c22-23 49-22 73-35 23-13 37-42 66-46 23-3 43 13 70 15 23 2 42-11 66-8 23 3 39 24 61 31 28 9 48 20 61 39 11 15 7 30-13 36-26 8-48 0-71 6-27 7-55 23-82 21-34-3-56-18-85-19-25-1-50 12-73 5-20-6-30-29-73-26-13 1-18-7-10-19z" />
      <path className="coast-line" d="M35 141c22-23 49-22 73-35 23-13 37-42 66-46 23-3 43 13 70 15 23 2 42-11 66-8 23 3 39 24 61 31 28 9 48 20 61 39" />
      {mapCities.map((city) => <g key={city.slug} className={`map-city ${activeCity === city.slug ? "is-active" : ""}`} style={{ "--city-x": `${city.x}px`, "--city-y": `${city.y}px` } as React.CSSProperties}><circle className="city-pulse" cx={city.x} cy={city.y} r="15" /><circle className="city-point" cx={city.x} cy={city.y} r="5" /><foreignObject x={city.x - 36} y={city.y + 10} width="72" height="28"><button type="button" className="city-label" onClick={() => selectCity(city.slug)} aria-label={`${city.name} ilanlarını göster`}>{city.name}</button></foreignObject></g>)}
    </svg>
    <p className="map-hint">Bir şehre dokun, ilanlara yaklaş.</p>
  </div>;
}

export function CategoryCard({ title, count, accent, icon }: { title: string; count: string; accent: string; icon: string }) {
  return <a className="category-card" href="#ilanlar" style={{ "--card-accent": accent } as React.CSSProperties}><span className="category-icon" aria-hidden="true">{icon}</span><span className="category-title">{title}</span><span className="category-count">{count}<span aria-hidden="true">↗</span></span></a>;
}

export function PopularLink({ children }: { children: React.ReactNode }) {
  return <a href="#ilanlar" className="popular-link">{children}<span aria-hidden="true">↗</span></a>;
}
