import { type AllowedLocale, allowedLocalesLookup } from "./constants";

export function isAllowedLocale(locale: string): locale is AllowedLocale {
	return locale in allowedLocalesLookup;
}
