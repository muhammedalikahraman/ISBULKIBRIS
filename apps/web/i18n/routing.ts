import { defineRouting } from "next-intl/routing";
import { LOCALES, DEFAULT_LOCALE } from "@isbulkibris/data";

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
});
