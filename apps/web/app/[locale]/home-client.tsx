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

const cities = ["Girne", "Lefkoşa", "Gazimağusa", "Güzelyurt"];

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

export function HeroOrb() {
  return <div className="hero-orb" aria-hidden="true"><div className="orb-core" /><div className="orb-ring orb-ring-one" /><div className="orb-ring orb-ring-two" /><span className="orb-label">KIBRIS<br /><strong>NETWORK</strong></span></div>;
}

export function CategoryCard({ title, count, accent, icon }: { title: string; count: string; accent: string; icon: string }) {
  return <a className="category-card" href="#ilanlar" style={{ "--card-accent": accent } as React.CSSProperties}><span className="category-icon" aria-hidden="true">{icon}</span><span className="category-title">{title}</span><span className="category-count">{count}<span aria-hidden="true">↗</span></span></a>;
}

export function PopularLink({ children }: { children: React.ReactNode }) {
  return <a href="#ilanlar" className="popular-link">{children}<span aria-hidden="true">↗</span></a>;
}
