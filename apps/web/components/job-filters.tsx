"use client";

import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { SlidersIcon, MapPinIcon, BriefcaseIcon, WifiIcon, XIcon } from "@/components/icons";

type City = { slug: string; name: string };
type Category = { slug: string; name: string };

type Props = {
  cities: City[];
  categories: Category[];
  currentCity?: string;
  currentCategory?: string;
  currentRemote?: string;
  locale: string;
  labels: {
    filters: string;
    city: string;
    category: string;
    remote: string;
    allCities: string;
    allCategories: string;
    allTypes: string;
    remote: string;
    hybrid: string;
    onsite: string;
    clear: string;
  };
};

export function JobFilters({
  cities,
  categories,
  currentCity,
  currentCategory,
  currentRemote,
  locale,
  labels,
}: Props) {
  const router = useRouter();
  const [city, setCity] = useState(currentCity ?? "");
  const [category, setCategory] = useState(currentCategory ?? "");
  const [remote, setRemote] = useState(currentRemote ?? "");

  function update(param: string, value: string) {
    const url = new URL(window.location.href);
    if (value) {
      url.searchParams.set(param, value);
    } else {
      url.searchParams.delete(param);
    }
    url.searchParams.delete("cursor");
    router.push(`${url.pathname}?${url.searchParams.toString()}`);
  }

  const remoteOptions = [
    { value: "remote", label: labels.remote },
    { value: "hybrid", label: labels.hybrid },
    { value: "onsite", label: labels.onsite },
  ];

  const hasActiveFilters = city || category || remote;

  function clearAll() {
    setCity("");
    setCategory("");
    setRemote("");
    router.push(window.location.pathname);
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <SlidersIcon className="h-4 w-4 text-primary-500" />
          {labels.filters}
        </h3>
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-800"
          >
            <XIcon className="h-3 w-3" />
            {labels.clear}
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* City filter */}
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-500">
            <MapPinIcon className="h-3.5 w-3.5" />
            {labels.city}
          </label>
          <select
            value={city}
            onChange={(e) => { setCity(e.target.value); update("city", e.target.value); }}
            className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:border-primary-500 focus:bg-white focus:ring-1 focus:ring-primary-500"
          >
            <option value="">{labels.allCities}</option>
            {cities.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Category filter */}
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-500">
            <BriefcaseIcon className="h-3.5 w-3.5" />
            {labels.category}
          </label>
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); update("category", e.target.value); }}
            className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:border-primary-500 focus:bg-white focus:ring-1 focus:ring-primary-500"
          >
            <option value="">{labels.allCategories}</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Remote type filter */}
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-500">
            <WifiIcon className="h-3.5 w-3.5" />
            {labels.remote}
          </label>
          <div className="flex flex-col gap-1.5">
            {remoteOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  const newVal = remote === opt.value ? "" : opt.value;
                  setRemote(newVal);
                  update("remote", newVal);
                }}
                className={`rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  remote === opt.value
                    ? "bg-primary-500 font-medium text-white"
                    : "bg-gray-50 text-gray-600 hover:bg-primary-50 hover:text-primary-700"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
