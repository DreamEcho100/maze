import { cache } from "react";

export interface Config {
	locale: string;
	allowedLocales: string[];
	defaultLocale: string;
	withoutLocale?: boolean;
}
export type Locale = Config["locale"];
export type AllowedLocale = Config["allowedLocales"][number];

// See https://github.com/vercel/next.js/discussions/58862
function initializeLocaleConfig() {
	const value: {
		locale?: Locale;
		allowedLocales?: Locale[] | readonly Locale[];
		defaultLocale?: Locale;
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-explicit-any
	} = ((global as unknown as { localeI18Config: Record<string, any> }).localeI18Config ??= {
		locale: undefined,
		allowedLocales: [],
		defaultLocale: undefined,
	});
	return value;
}

export const initializeLocaleConfigCache = cache(initializeLocaleConfig);
export function updateLocaleConfigCache(props: {
	locale?: Locale;
	allowedLocales?: AllowedLocale[] | readonly AllowedLocale[];
	defaultLocale?: Locale;
}) {
	let key: keyof typeof props;
	for (key in props) {
		const value = props[key];
		if (Object.prototype.hasOwnProperty.call(props, key) && value !== undefined) {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			initializeLocaleConfigCache()[key] = value;
		}
	}
}
