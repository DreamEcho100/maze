import { initI18nSolidStart } from "@de100/i18n-solid-startjs/server/init";
import { allowedLocales, defaultLocale } from "../constants";

const {
	getCurrentRequestConfig,
	getRequestLocale,
	permanentRedirect,
	redirect,
	setRequestLocale,
} = initI18nSolidStart({
	allowedLocales: allowedLocales,
	defaultLocale: defaultLocale,
});

export {
	getCurrentRequestConfig,
	getRequestLocale,
	permanentRedirect,
	redirect,
	setRequestLocale,
};

// TODO: use the [`useSession`](https://docs.solidjs.com/solid-start/advanced/session)

import { getCookie, type HTTPEvent, setCookie } from "vinxi/http";
import type { AllowedLocale } from "../constants";
import { isAllowedLocale } from "../is-allowed-locale";

export function getLocaleFromAcceptLanguageHeader(headers: Headers) {
	// 2. Check Accept-Language header
	const acceptLanguageHeader =
		headers.get("accept-language") || headers.get("accept-language");

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

function getLocaleFromCookies(nativeEvent: HTTPEvent) {
	const cookieLocale = getCookie(nativeEvent, "locale");
	const cookieXLocale = getCookie(nativeEvent, "x-locale");
	return [cookieLocale, cookieXLocale] as const;
}

function getForcedLocaleFromCookies(nativeEvent: HTTPEvent) {
	const cookieLocale = getCookie(nativeEvent, "forced-locale");
	return cookieLocale;
}
export function setLocaleInCookies(
	nativeEvent: HTTPEvent,
	locale: AllowedLocale,
) {
	const [cookieLocale, cookieXLocale] = getLocaleFromCookies(nativeEvent);
	if (cookieLocale !== locale) {
		setCookie(nativeEvent, "x-locale", locale, {
			path: "/",
			maxAge: 31536000, // 1 year
			sameSite: "lax",
		});
	}
	if (cookieXLocale !== locale) {
		setCookie(nativeEvent, "locale", locale, {
			path: "/",
			maxAge: 31536000, // 1 year
			sameSite: "lax",
		});
	}
}
function getLocaleFromHeaders(nativeEvent: HTTPEvent) {
	const headers = nativeEvent.headers;
	const headerLocale = headers.get("locale");
	const headerXLocale = headers.get("x-locale");
	return [headerLocale, headerXLocale] as const;
}
export function setLocaleInHeaders(
	nativeEvent: HTTPEvent,
	locale: AllowedLocale,
) {
	const headers = nativeEvent.headers;
	const [headerLocale, headerXLocale] = getLocaleFromHeaders(nativeEvent);
	if (headerLocale !== locale) {
		headers.set("x-locale", locale);
	}
	if (headerXLocale !== locale) {
		headers.set("x-locale", locale);
	}
}

type LocaleSource =
	| "pathname"
	| "cookies"
	| "headers"
	| "accept-language"
	| "default";

const localeDeterminationStrategies: ((props: {
	nativeEvent: HTTPEvent;
	headers: Headers;
	pathname: string;
}) =>
	| {
			localeSource: Exclude<LocaleSource, "default">;
			foundLocale: AllowedLocale;
			shouldSetCookie: boolean;
	  }
	| undefined)[] = [
	(props) => {
		const forcedLocaleFromCookies = getForcedLocaleFromCookies(
			props.nativeEvent,
		);
		if (forcedLocaleFromCookies && isAllowedLocale(forcedLocaleFromCookies)) {
			return {
				localeSource: "cookies",
				foundLocale: forcedLocaleFromCookies,
				shouldSetCookie: false,
			};
		}
	},
	(props) => {
		if (!props.pathname) {
			return;
		}
		const pathLocale = props.pathname.split("/")[1] as AllowedLocale;
		if (isAllowedLocale(pathLocale)) {
			return {
				localeSource: "pathname",
				foundLocale: pathLocale,
				shouldSetCookie: true,
			};
		}
	},
	(props) => {
		const cookiesLocales = getLocaleFromCookies(props.nativeEvent);
		const cookieLocale = cookiesLocales[0] ?? cookiesLocales[1];
		if (cookieLocale && isAllowedLocale(cookieLocale)) {
			return {
				localeSource: "cookies",
				foundLocale: cookieLocale,
				shouldSetCookie: true,
			};
		}
	},
	(props) => {
		const headersLocales = getLocaleFromHeaders(props.nativeEvent);
		const headerLocale = headersLocales[0] ?? headersLocales[1];
		if (headerLocale && isAllowedLocale(headerLocale)) {
			return {
				localeSource: "headers",
				foundLocale: headerLocale,
				shouldSetCookie: true,
			};
		}
	},
	(props) => {
		const headersLocales = getLocaleFromHeaders(props.nativeEvent);
		const headerLocale = headersLocales[0] ?? headersLocales[1];
		if (headerLocale && isAllowedLocale(headerLocale)) {
			return {
				localeSource: "headers",
				foundLocale: headerLocale,
				shouldSetCookie: true,
			};
		}
	},
	(props) => {
		const acceptLanguageLocale = getLocaleFromAcceptLanguageHeader(
			props.headers,
		);
		if (acceptLanguageLocale) {
			return {
				localeSource: "accept-language",
				foundLocale: acceptLanguageLocale,
				shouldSetCookie: true,
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
	shouldSetCookie: boolean;
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
		shouldSetCookie: true,
	};
}
