"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { SearchIcon, MapPinIcon, BriefcaseIcon } from "@/components/icons";

type City = { slug: string; name: string };
type Category = { slug: string; name: string };

type Props = {
  cities: City[];
  categories: Category[];
  searchPlaceholder: string;
  cityPlaceholder: string;
  categoryPlaceholder: string;
  buttonText: string;
  locale: string;
};

export function JobSearchBar({
  cities,
  categories,
  searchPlaceholder,
  cityPlaceholder,
  categoryPlaceholder,
  buttonText,
  locale,
}: Props) {
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (city) params.set("city", city);
    if (category) params.set("category", category);
    const query = params.toString();
    router.push(`/ilanlar${query ? `?${query}` : ""}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-primary-900/5 sm:flex-row sm:items-center sm:gap-2 sm:rounded-full sm:p-2"
    >
      {/* Keyword */}
      <div className="relative flex-1">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full rounded-xl border-0 bg-gray-50 py-3.5 pl-12 pr-4 text-base text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-primary-500 sm:rounded-full"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
        {/* City */}
        <div className="relative flex-1 sm:flex-initial">
          <MapPinIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full appearance-none rounded-xl border-0 bg-gray-50 py-3.5 pl-12 pr-10 text-base text-gray-900 focus:bg-white focus:ring-2 focus:ring-primary-500 sm:rounded-full sm:min-w-[160px]"
          >
            <option value="">{cityPlaceholder}</option>
            {cities.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          <svg className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Category */}
        <div className="relative flex-1 sm:flex-initial">
          <BriefcaseIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full appearance-none rounded-xl border-0 bg-gray-50 py-3.5 pl-12 pr-10 text-base text-gray-900 focus:bg-white focus:ring-2 focus:ring-primary-500 sm:rounded-full sm:min-w-[160px]"
          >
            <option value="">{categoryPlaceholder}</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          <svg className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="flex items-center justify-center gap-2 rounded-xl bg-accent-500 px-6 py-3.5 text-base font-semibold text-primary-950 shadow-lg shadow-accent-500/20 transition-all hover:bg-accent-400 hover:shadow-xl hover:shadow-accent-500/30 sm:rounded-full"
      >
        <SearchIcon className="h-5 w-5" />
        {buttonText}
      </button>
    </form>
  );
}
