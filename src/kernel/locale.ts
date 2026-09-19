export const LOCALES = ["tr", "en", "ru", "he"] as const;
export type LocaleCode = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: LocaleCode = "tr";

export const LOCALE_FALLBACK: Record<LocaleCode, LocaleCode | null> = {
  tr: null,
  en: "tr",
  ru: "en",
  he: "en",
};

export const LOCALE_DIR: Record<LocaleCode, "ltr" | "rtl"> = {
  tr: "ltr",
  en: "ltr",
  ru: "ltr",
  he: "rtl",
};

export const TS_CONFIG: Record<LocaleCode, "turkish" | "english" | "simple"> = {
  tr: "turkish",
  en: "english",
  ru: "simple",
  he: "simple",
};

export function fallbackChain(locale: LocaleCode): LocaleCode[] {
  const chain: LocaleCode[] = [locale];
  let next = LOCALE_FALLBACK[locale];
  while (next && !chain.includes(next)) {
    chain.push(next);
    next = LOCALE_FALLBACK[next];
  }
  if (!chain.includes(DEFAULT_LOCALE)) chain.push(DEFAULT_LOCALE);
  return chain;
}
