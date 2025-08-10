// import type { IntlConfig, Locale } from "use-intl/core";

import type { LanguageMessages } from "@de100/i18n";
import { match } from "@formatjs/intl-localematcher";
import { query, redirect as solidRedirect } from "@solidjs/router";
import Negotiator from "negotiator";
// import { cookies, headers } from "next/headers.js";
// import {
// 	// permanentRedirect as solidPermanentRedirect,
// 	// redirect as solidRedirect,
// 	RedirectType,
// } from "next/navigation";
import { getCookie, getHeader, setCookie } from "vinxi/http";
import { parsePathname } from "#utils";
import type { Locale } from "./config";
import { initializeLocaleConfigCache, updateLocaleConfigCache } from "./config";

export function isPromise<Value>(
	value: Value | Promise<Value>,
): value is Promise<Value> {
	return typeof (value as any)?.then === "function";
}

// import type {Locale} from 'use-intl';

// Used to read the locale from the middleware
export const I18N_HEADER_LOCALE_NAME = "X-DE100-I18N-LOCALE";

async function getHeadersImpl(): Promise<Headers> {
	const promiseOrValue = getHeaders();

	// Compatibility with Next.js <15
	return isPromise(promiseOrValue) ? await promiseOrValue : promiseOrValue;
}
const getHeaders = query(getHeadersImpl, "headers");

async function getLocaleFromHeaderImpl(): Promise<Locale | undefined> {
	let locale: string | undefined;

	try {
		// locale =
		// 	(await getHeaders()).get(I18N_HEADER_LOCALE_NAME) ??
		// 	(await cookies()).get(I18N_HEADER_LOCALE_NAME)?.value ??
		locale =
			getHeader(I18N_HEADER_LOCALE_NAME) ??
			getCookie(I18N_HEADER_LOCALE_NAME) ??
			undefined;
		undefined;
		if (locale) updateLocaleConfigCache({ locale });
	} catch (error) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
		if (
			error instanceof Error &&
			(error as any).digest === "DYNAMIC_SERVER_USAGE"
		) {
			const wrappedError = new Error(
				"Usage of @de100/i18n APIs in Server Components currently opts into dynamic rendering. This limitation will eventually be lifted, but as a stopgap solution, you can use the `setRequestLocale` API to enable static rendering, see https://next-intl.dev/docs/getting-started/app-router/with-i18n-routing#static-rendering",
				{ cause: error },
			);
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
			(wrappedError as any).digest = (error as any).digest;
			throw wrappedError;
		}
		throw error;
	}

	return locale;
}
const getLocaleFromHeader = query(getLocaleFromHeaderImpl, "localeFromHeader");

export async function getRequestLocale() {
	return initializeLocaleConfigCache().locale ?? (await getLocaleFromHeader());
}

export async function getCurrentRequestConfig(
	loadLocaleMessages: (
		locale: Locale,
	) => Promise<Record<string, LanguageMessages>>,
) {
	// This typically corresponds to the `[locale]` segment
	const store = initializeLocaleConfigCache();
	const locale: Locale | undefined =
		(await getRequestLocale()) ?? store.defaultLocale;

	// Ensure that a valid locale is used
	if (!locale || !store.allowedLocales?.includes(locale)) {
		throw new Error("No locale found in request headers or cache.");
	}

	return {
		locale,
		messages: await loadLocaleMessages(locale),
	};
}

export function setRequestLocale(locale: Locale, _headers?: Headers) {
	// const headers = _headers ?? (await getHeaders());
	// // const _cookies = (await cookies()).set(I18N_HEADER_LOCALE_NAME, locale)
	// // Set the locale in the headers
	// headers.set(I18N_HEADER_LOCALE_NAME, locale);
	// (await cookies()).set(I18N_HEADER_LOCALE_NAME, locale);

	// Set the locale in cookies for persistence
	setCookie(I18N_HEADER_LOCALE_NAME, locale, {
		httpOnly: false,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		maxAge: 60 * 60 * 24 * 365, // 1 year
	});

	// Update the locale in the cache
	updateLocaleConfigCache({ locale });
}

// Custom redirect function that maintains country code and locale
export function redirect(
	path: string,
	init?: ResponseInit,
	props?: {
		// countryCode?: string,
		locale?: string;
	},
) {
	if (path.startsWith("http")) {
		return solidRedirect(path, init);
	}

	const {
		// countryCode: currentCountryCode,
		locale: currentLocale,
		restPath,
	} = parsePathname(path, initializeLocaleConfigCache());

	if (!currentLocale) {
		throw new Error("!currentLocale");
	}

	const targetLocale = props?.locale ?? currentLocale; // ?? defaultLocale;
	if (!restPath) {
		solidRedirect(`/${targetLocale}`, init);
	}

	solidRedirect(`/${targetLocale}${restPath}`, init);
}

export function permanentRedirect(
	path: string,
	init?: ResponseInit,
	props?: {
		// countryCode?: string,
		locale?: string;
	},
) {
	const init_ = { ...init, status: 301 };

	if (path.startsWith("http")) {
		return solidRedirect(path, init_);
	}

	const {
		// countryCode: currentCountryCode,
		locale: currentLocale,
		restPath,
	} = parsePathname(path, initializeLocaleConfigCache());

	if (!currentLocale) {
		throw new Error("!currentLocale");
	}

	const targetLocale = props?.locale ?? currentLocale; // ?? defaultLocale;
	if (!restPath) {
		solidRedirect(`/${targetLocale}`, init_);
	}

	solidRedirect(`/${targetLocale}${restPath}`, init_);
}

export async function getLocale(_headersReq?: Headers) {
	// const cookiesManager = await cookies();
	// const locale = cookiesManager.get("NEXT_LOCALE")?.value;
	const locale = await getLocaleFromHeader();
	const headersReq = await getHeaders();

	if (locale) {
		return locale;
	}

	const allowedLocales = initializeLocaleConfigCache().allowedLocales;
	const defaultLocale = initializeLocaleConfigCache().defaultLocale;

	if (!allowedLocales || !defaultLocale) {
		throw new Error("Allowed locales or default locale not set in config.");
	}

	const headers = {
		"accept-language": headersReq.get("accept-language") ?? "en-US,en;q=0.5",
	};
	const languages = new Negotiator({ headers }).languages();

	return match(languages, allowedLocales, defaultLocale); // -> 'en-US'
}
