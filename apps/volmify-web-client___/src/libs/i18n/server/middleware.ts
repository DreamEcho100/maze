import type { FetchEvent } from "@solidjs/start/server";
import { getCookie, type HTTPEvent, setCookie } from "vinxi/http";
import { type AllowedLocale, defaultLocale } from "../constants.ts";
import { getServerLocale } from "./get-server-locale.ts";

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

export function createI18nMiddlewareOnRequest({ event }: { event: FetchEvent }) {
	const url = new URL(event.request.url);
	const pathname = url.pathname;

	const {
		foundLocale = defaultLocale,
		localeSource,
		shouldSetCookie,
	} = getServerLocale({
		nativeEvent: event.nativeEvent,
		headers: event.request.headers,
		pathname,
	});
	if (shouldSetCookie) {
		setLocaleInCookies(event.nativeEvent, foundLocale);
		// set on the headers as well
		event.request.headers.set("x-locale", foundLocale);
	}

	event.locals.i18n = {
		foundLocale,
		localeSource,
		shouldSetCookie,
	};

	switch (localeSource) {
		case "pathname":
			// Locale found in URL, set header and continue
			return {
				redirectUrl: undefined,
				foundLocale,
				localeSource,
				shouldSetCookie,
			};
		default:
			// No locale in URL, determine locale from headers/cookies
			// Redirect to URL with locale prefix
			url.pathname = `/${foundLocale}${pathname}`;
			return {
				redirectUrl: url.toString(),
				foundLocale,
				localeSource,
				shouldSetCookie,
			};
	}
}
