import type { FetchEvent } from "@solidjs/start/server";
import { defaultLocale } from "../constants.ts";
import { getServerLocale, setLocaleInCookies, setLocaleInHeaders } from "./get-server-locale.ts";

export function createI18nMiddlewareOnRequest({ event }: { event: FetchEvent }) {
	const url = new URL(event.request.url);
	const pathname = url.pathname;
	console.log("___ pathname", pathname);

	const {
		foundLocale = defaultLocale,
		localeSource,
		shouldStoreLocale,
	} = getServerLocale({
		nativeEvent: event.nativeEvent,
		headers: event.request.headers,
		pathname,
	});
	if (shouldStoreLocale) {
		setLocaleInHeaders(event.request.headers, foundLocale);
		setLocaleInCookies(event.nativeEvent, foundLocale);
	}

	event.locals.i18n = {
		foundLocale,
		localeSource,
		shouldStoreLocale,
	};

	switch (localeSource) {
		case "pathname":
			// Locale found in URL, set header and continue
			return {
				redirectUrl: undefined,
				foundLocale,
				localeSource,
				shouldStoreLocale,
			};
		default:
			// No locale in URL, determine locale from headers/cookies
			// Redirect to URL with locale prefix
			url.pathname = `/${foundLocale}${pathname}`;
			return {
				redirectUrl: url.toString(),
				foundLocale,
				localeSource,
				shouldStoreLocale,
			};
	}
}
