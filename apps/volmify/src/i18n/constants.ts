export const allowedLocales = ["en", "ar"] as const;
export const defaultLocale = "en";
export const fallbackLocale = "en";

export type AllowedLocale = (typeof allowedLocales)[number];
