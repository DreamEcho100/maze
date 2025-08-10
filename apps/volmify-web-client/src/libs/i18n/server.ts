import { initI18nSolidStart } from "@de100/i18n-solid-startjs/server/init";
import type { FetchEvent } from "@solidjs/start/server";
import { allowedLocales, defaultLocale } from "./constants";

const { getCurrentRequestConfig, getRequestLocale, permanentRedirect, redirect, setRequestLocale } =
	initI18nSolidStart({
		allowedLocales: allowedLocales,
		defaultLocale: defaultLocale,
	});

export { getCurrentRequestConfig, getRequestLocale, permanentRedirect, redirect, setRequestLocale };

import { query } from "@solidjs/router";
import { getRequestEvent } from "solid-js/web";
import { getCookie, type HTTPEvent, setCookie } from "vinxi/http";
import type { AllowedLocale } from "./constants";
import { isAllowedLocale } from "./is-allowed-locale";

export function getLocaleFromAcceptLanguageHeader(headers: Headers) {
	// 2. Check Accept-Language header
	const acceptLanguageHeader = headers.get("accept-language") || headers.get("accept-language");

	if (!acceptLanguageHeader) {
		return;
	}

	const acceptLanguages = acceptLanguageHeader.split(",");
	for (const lang of acceptLanguages) {
		const langCode = lang.split(";")[0].trim().split("-")[0] as AllowedLocale;
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

export const getTranslation = async (registeredLocale?: string) => {
	// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
	const locale = (registeredLocale || defaultLocale) as (typeof allowedLocales)[number];
	if (!allowedLocales.includes(locale)) {
		throw new Error(`Locale "${locale}" is not allowed.`);
	}

	switch (locale) {
		case "ar":
			return (await import("#libs/i18n/messages/ar.ts")).default;
		default:
			return (await import("#libs/i18n/messages/en.ts")).default;
	}

	// // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
	// return (await import(`#libs/i18n/messages/${locale}.ts`)).default as Record<
	// 	Lowercase<string>,
	// 	LanguageMessages
	// >;
};

export const getTranslationQuery = async (props: { locale?: AllowedLocale; direct: boolean }) => {
	"use server";
	const requestEvent = getRequestEvent();
	if (!requestEvent) {
		throw new Error("No `requestEvent` found!");
	}

	const pathname = new URL(requestEvent.request.url).pathname;
	const pathnameFirstSegment = pathname.split("/")[1];
	const notAllowedMap = {
		server: true,
		_server: true,
		_build: true,
		assets: true,
		api: true,
	};
	// Skip middleware for static files and API routes
	if (
		pathnameFirstSegment &&
		(pathnameFirstSegment in notAllowedMap || // Skip
			pathnameFirstSegment.includes(".")) // Skip if it contains a dot (e.g., file extensions)
	) {
		return;
	}

	let locale: AllowedLocale | undefined = props.locale;
	if (!locale) {
		const { foundLocale = defaultLocale } = getServerLocale({
			nativeEvent: requestEvent.nativeEvent,
			headers: requestEvent.request.headers,
			pathname,
		});
		locale = foundLocale;
	}
	setLocaleInCookies(requestEvent.nativeEvent, locale);

	return {
		translation: await query(getTranslation, `localeTranslations-${locale}`)(locale),
		locale,
	};
};

export function createI18nMiddlewareOnRequest({ event }: { event: FetchEvent }) {
	const url = new URL(event.request.url);
	const pathname = url.pathname;

	const { foundLocale = defaultLocale, localeSource } = getServerLocale({
		nativeEvent: event.nativeEvent,
		headers: event.request.headers,
		pathname,
	});
	setLocaleInCookies(event.nativeEvent, foundLocale);

	switch (localeSource) {
		case "pathname":
			// Locale found in URL, set header and continue
			return;
		default:
			// No locale in URL, determine locale from headers/cookies
			// Redirect to URL with locale prefix
			url.pathname = `/${foundLocale}${pathname}`;
			return Response.redirect(url.toString(), 302);
	}
}
