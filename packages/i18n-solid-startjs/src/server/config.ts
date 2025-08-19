// import { query } from "@solidjs/router";

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
		getServerLocale: () => string | undefined;
		// biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
	} = ((
		globalThis as unknown as {
			localeI18Config: {
				locale?: Locale;
				allowedLocales?: Locale[] | readonly Locale[];
				defaultLocale?: Locale;
				getServerLocale: () => string | undefined;
			};
		}
	).localeI18Config ??= {
		locale: undefined,
		allowedLocales: [],
		defaultLocale: undefined,
		getServerLocale: () => {
			throw new Error("getServerLocale is not implemented");
		},
	});
	return value;
}

export const localeConfigCache = initializeLocaleConfig();

export function updateLocaleConfigCache(props: {
	locale?: Locale;
	allowedLocales?: AllowedLocale[] | readonly AllowedLocale[];
	defaultLocale?: Locale;
	getServerLocale?: () => Locale | undefined;
}) {
	props.locale ??= props.getServerLocale?.();

	let key: keyof typeof props;
	for (key in props) {
		const value = props[key];
		if (Object.hasOwn(props, key) && value !== undefined) {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-expect-error
			initializeLocaleConfig()[key] = value;
		}
	}
}
