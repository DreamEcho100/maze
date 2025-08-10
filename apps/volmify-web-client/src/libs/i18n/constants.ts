export const allowedLocales = ["en", "ar"] as const;
export const allowedLocalesLookup = Object.fromEntries(
	allowedLocales.map((locale) => [locale, true]),
) as Record<AllowedLocale, true>;
export const defaultLocale = "en";
export const fallbackLocale = "en";

export type AllowedLocale = (typeof allowedLocales)[number];
