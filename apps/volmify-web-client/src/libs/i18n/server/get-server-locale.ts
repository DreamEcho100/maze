import { getCookie, type HTTPEvent, setCookie } from "vinxi/http";
import { type AllowedLocale, defaultLocale, LOCAL_STORAGE_KEY } from "../constants.ts";
import { isAllowedLocale } from "../is-allowed-locale.ts";

export function getLocaleFromAcceptLanguageHeader(headers: Headers) {
	// 2. Check Accept-Language header
	const acceptLanguageHeader = headers.get("accept-language") || headers.get("accept-language");

	if (!acceptLanguageHeader) {
		return;
	}

	const acceptLanguages = acceptLanguageHeader.split(",");
	for (const lang of acceptLanguages) {
		const langCode = lang.split(";")[0]?.trim().split("-")[0] as AllowedLocale;
		if (isAllowedLocale(langCode)) {
			return langCode;
		}
	}
}

export function getLocaleFromCookies(nativeEvent: HTTPEvent) {
	const cookieLocale = getCookie(nativeEvent, LOCAL_STORAGE_KEY);
	return isAllowedLocale(cookieLocale) ? cookieLocale : undefined;
}

export function getForcedLocaleFromCookies(nativeEvent: HTTPEvent) {
	const cookieLocale = getCookie(nativeEvent, "tmp-locale");
	return isAllowedLocale(cookieLocale) ? cookieLocale : undefined;
}

export function setLocaleInCookies(nativeEvent: HTTPEvent, locale: AllowedLocale) {
	const cookieLocale = getLocaleFromCookies(nativeEvent);
	if (cookieLocale !== locale) {
		setCookie(nativeEvent, LOCAL_STORAGE_KEY, locale, {
			path: "/",
			maxAge: 31536000, // 1 year
			sameSite: "lax",
		});
	}
}
export function getLocaleFromHeaders(headers: Headers) {
	const localeValue = headers.get(LOCAL_STORAGE_KEY);
	return isAllowedLocale(localeValue) ? localeValue : undefined;
}
export function setLocaleInHeaders(headers: Headers, locale: AllowedLocale) {
	const localeValue = getLocaleFromHeaders(headers);
	if (localeValue !== locale) {
		headers.set(LOCAL_STORAGE_KEY, locale);
	}
}

export type LocaleSource =
	| "pathname"
	| "cookie"
	| "headers"
	| "accept-language"
	| "default"
	| "forced-cookie";
export const localeDeterminationStrategies: ((props: {
	nativeEvent: HTTPEvent;
	headers: Headers;
	pathname: string;
}) =>
	| {
			localeSource: Exclude<LocaleSource, "default">;
			foundLocale: AllowedLocale;
			shouldStoreLocale: boolean;
	  }
	| undefined)[] = [
	(props) => {
		const localeValue = getForcedLocaleFromCookies(props.nativeEvent);
		if (localeValue && isAllowedLocale(localeValue)) {
			return {
				localeSource: "forced-cookie",
				foundLocale: localeValue,
				shouldStoreLocale: true,
			};
		}
	},
	(props) => {
		if (!props.pathname) {
			return;
		}
		const localeValue = props.pathname.split("/")[1] as AllowedLocale;
		if (isAllowedLocale(localeValue)) {
			return {
				localeSource: "pathname",
				foundLocale: localeValue,
				shouldStoreLocale: true,
			};
		}
	},
	(props) => {
		const localeValue = getLocaleFromCookies(props.nativeEvent);
		if (localeValue && isAllowedLocale(localeValue)) {
			return {
				localeSource: "cookie",
				foundLocale: localeValue,
				shouldStoreLocale: true,
			};
		}
	},
	(props) => {
		const localeValue = getLocaleFromHeaders(props.nativeEvent.headers);
		if (localeValue && isAllowedLocale(localeValue)) {
			return {
				localeSource: "headers",
				foundLocale: localeValue,
				shouldStoreLocale: true,
			};
		}
	},
	(props) => {
		const localeValue = getLocaleFromAcceptLanguageHeader(props.headers);
		if (localeValue) {
			return {
				localeSource: "accept-language",
				foundLocale: localeValue,
				shouldStoreLocale: true,
			};
		}
	},
];

// Server-side locale detection
export function getServerLocale(props: {
	nativeEvent: HTTPEvent;
	headers: Headers;
	pathname: string;
}): {
	foundLocale: AllowedLocale;
	localeSource: LocaleSource;
	shouldStoreLocale: boolean;
} {
	for (const localeDeterminationStrategy of localeDeterminationStrategies) {
		const result = localeDeterminationStrategy(props);
		if (result) {
			return result;
		}
	}

	return {
		foundLocale: defaultLocale,
		localeSource: "default",
		shouldStoreLocale: true,
	};
}
