import { type AllowedLocale, allowedLocalesLookup } from "./constants";

export function isAllowedLocale(locale: any): locale is AllowedLocale {
	return typeof locale === "string" && locale in allowedLocalesLookup;
}
