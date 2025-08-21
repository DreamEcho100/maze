import type { FetchEvent } from "@solidjs/start/server";
import { defaultLocale } from "../constants.ts";
import { getServerLocale, setLocaleInCookies } from "./get-server-locale.ts";

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
				response: undefined,
				foundLocale,
				localeSource,
				shouldSetCookie,
			};
		default:
			// No locale in URL, determine locale from headers/cookies
			// Redirect to URL with locale prefix
			url.pathname = `/${foundLocale}${pathname}`;
			return {
				response: Response.redirect(url.toString(), 302),
				foundLocale,
				localeSource,
				shouldSetCookie,
			};
	}
}
