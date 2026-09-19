export function siteBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function localeUrl(locale: string, path = ""): string {
  const suffix = path.startsWith("/") ? path : path ? `/${path}` : "";
  return `${siteBaseUrl()}/${locale}${suffix}`;
}

export function hreflangMap(path = ""): Record<string, string> {
  const locales = ["tr", "en", "ru", "he"] as const;
  const languages = Object.fromEntries(locales.map((l) => [l, localeUrl(l, path)]));
  return { ...languages, "x-default": localeUrl("tr", path) };
}
