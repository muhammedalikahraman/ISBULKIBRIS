"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { GlobeIcon, ChevronDownIcon } from "@/components/icons";
import type { LocaleCode } from "@isbulkibris/data";

const LOCALE_LABELS: Record<LocaleCode, { label: string; flag: string }> = {
  tr: { label: "Türkçe", flag: "🇹🇷" },
  en: { label: "English", flag: "🇬🇧" },
  ru: { label: "Русский", flag: "🇷🇺" },
  he: { label: "עברית", flag: "🇮🇱" },
};

type Props = {
  currentLocale: string;
  variant?: "light" | "dark";
};

export function LanguageSwitcher({ currentLocale, variant = "dark" }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const current = LOCALE_LABELS[currentLocale as LocaleCode] ?? LOCALE_LABELS.tr;
  const textColor = variant === "light" ? "text-white" : "text-gray-700";
  const hoverColor = variant === "light" ? "hover:bg-white/10" : "hover:bg-gray-100";

  function switchTo(locale: LocaleCode) {
    setOpen(false);
    if (locale === currentLocale) return;
    router.replace(pathname, { locale });
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium ${textColor} ${hoverColor} transition-colors`}
        aria-label="Change language"
        aria-expanded={open}
      >
        <GlobeIcon className="h-4 w-4" />
        <span className="hidden sm:inline">{current.flag}</span>
        <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg animate-scale-in z-50">
          {(Object.keys(LOCALE_LABELS) as LocaleCode[]).map((locale) => (
            <button
              key={locale}
              onClick={() => switchTo(locale)}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-primary-50 ${
                locale === currentLocale ? "bg-primary-50 font-semibold text-primary-900" : "text-gray-700"
              }`}
            >
              <span className="text-lg">{LOCALE_LABELS[locale].flag}</span>
              <span>{LOCALE_LABELS[locale].label}</span>
              {locale === currentLocale && (
                <span className="ml-auto h-2 w-2 rounded-full bg-primary-500" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
