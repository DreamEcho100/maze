import type { LanguageMessages } from "@de100/i18n";

import { allowedLocales, defaultLocale } from "./constants";

export const getTranslation = async (registeredLocale?: string) => {
	// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
	const locale = (registeredLocale || defaultLocale) as (typeof allowedLocales)[number];
	if (!allowedLocales.includes(locale)) {
		throw new Error(`Locale "${locale}" is not allowed.`);
	}

	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
	return (await import(`#i18n/messages/${locale}.ts`)).default as Record<
		Lowercase<string>,
		LanguageMessages
	>;
};
