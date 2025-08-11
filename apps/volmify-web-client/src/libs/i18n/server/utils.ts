import {
	type InitI18nSolidStartReturns,
	initI18nSolidStart,
} from "@de100/i18n-solid-startjs/server/init";
import { allowedLocales, defaultLocale } from "../constants";

/** @type {InitI18nSolidStartReturns} */
const {
	getCurrentRequestConfig,
	getRequestLocale,
	permanentRedirect,
	redirect,
	setRequestLocale,
}: InitI18nSolidStartReturns = initI18nSolidStart({
	allowedLocales: allowedLocales,
	defaultLocale: defaultLocale,
}) as InitI18nSolidStartReturns;

export { getCurrentRequestConfig, getRequestLocale, permanentRedirect, redirect, setRequestLocale };

import { getCookie, type HTTPEvent, setCookie } from "vinxi/http";
import type { AllowedLocale } from "../constants";
import { isAllowedLocale } from "../is-allowed-locale";

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

function getLocaleFromCookies(nativeEvent: HTTPEvent) {
	const cookieLocale = getCookie(nativeEvent, "locale");
	const cookieXLocale = getCookie(nativeEvent, "x-locale");
	return [cookieLocale, cookieXLocale] as const;
}
export function setLocaleInCookies(nativeEvent: HTTPEvent, locale: AllowedLocale) {
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
export function setLocaleInHeaders(nativeEvent: HTTPEvent, locale: AllowedLocale) {
	const headers = nativeEvent.headers;
	const [headerLocale, headerXLocale] = getLocaleFromHeaders(nativeEvent);
	if (headerLocale !== locale) {
		headers.set("x-locale", locale);
	}
	if (headerXLocale !== locale) {
		headers.set("x-locale", locale);
	}
}
// Server-side locale detection
export function getServerLocale({
	nativeEvent,
	headers,
	pathname,
}: {
	nativeEvent: HTTPEvent;
	headers: Headers;
	pathname: string;
}) {
	let foundLocale: AllowedLocale | undefined;
	let localeSource: "pathname" | "cookies" | "headers" | "accept-language" | undefined;

	if (pathname) {
		const pathLocale = pathname.split("/")[1] as AllowedLocale;
		if (isAllowedLocale(pathLocale)) {
			localeSource = "pathname";
			foundLocale = pathLocale;
		}
	}

	if (!foundLocale) {
		const cookiesLocales = getLocaleFromCookies(nativeEvent);
		const cookieLocale = cookiesLocales[0] ?? cookiesLocales[1];
		if (cookieLocale && isAllowedLocale(cookieLocale)) {
			localeSource = "cookies";
			foundLocale = cookieLocale;
		}
	}

	if (!foundLocale) {
		const headersLocales = getLocaleFromHeaders(nativeEvent);
		const headerLocale = headersLocales[0] ?? headersLocales[1];
		if (headerLocale && isAllowedLocale(headerLocale)) {
			localeSource = "headers";
			foundLocale = headerLocale;
		}
	}

	if (!foundLocale) {
		const acceptLanguageLocale = getLocaleFromAcceptLanguageHeader(headers);
		if (acceptLanguageLocale) {
			localeSource = "accept-language";
			foundLocale = acceptLanguageLocale;
		}
	}

	return { foundLocale, localeSource };
}
