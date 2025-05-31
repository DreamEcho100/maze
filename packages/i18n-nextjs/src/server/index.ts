// import type { IntlConfig, Locale } from "use-intl/core";
import { cache } from "react";
import { headers } from "next/headers.js";
import {
	permanentRedirect as nextPermanentRedirect,
	redirect as nextRedirect,
	RedirectType,
} from "next/navigation";

import type { LanguageMessages } from "@de100/i18n";

import type { Locale } from "./config";
import { parsePathname } from "#utils";
import { initializeLocaleConfigCache, updateLocaleConfigCache } from "./config";

export function isPromise<Value>(value: Value | Promise<Value>): value is Promise<Value> {
	// https://github.com/amannn/next-intl/issues/1711
	// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
	return typeof (value as any)?.then === "function";
}

// import type {Locale} from 'use-intl';

// Used to read the locale from the middleware
export const HEADER_LOCALE_NAME = "X-NEXT-INTL-LOCALE";

async function getHeadersImpl(): Promise<Headers> {
	const promiseOrValue = headers();

	// Compatibility with Next.js <15
	return isPromise(promiseOrValue) ? await promiseOrValue : promiseOrValue;
}
const getHeaders = cache(getHeadersImpl);

async function getLocaleFromHeaderImpl(): Promise<Locale | undefined> {
	let locale;

	try {
		locale = (await getHeaders()).get(HEADER_LOCALE_NAME) ?? undefined;
		if (locale) updateLocaleConfigCache({ locale });
	} catch (error) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
		if (error instanceof Error && (error as any).digest === "DYNAMIC_SERVER_USAGE") {
			const wrappedError = new Error(
				"Usage of next-intl APIs in Server Components currently opts into dynamic rendering. This limitation will eventually be lifted, but as a stopgap solution, you can use the `setRequestLocale` API to enable static rendering, see https://next-intl.dev/docs/getting-started/app-router/with-i18n-routing#static-rendering",
				{ cause: error },
			);
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
			(wrappedError as any).digest = (error as any).digest;
			throw wrappedError;
		} else {
			throw error;
		}
	}

	return locale;
}
const getLocaleFromHeader = cache(getLocaleFromHeaderImpl);

export async function getRequestLocale() {
	return initializeLocaleConfigCache().locale ?? (await getLocaleFromHeader());
}

export async function getCurrentRequestConfig(
	loadLocaleMessages: (locale: Locale) => Promise<Record<string, LanguageMessages>>,
) {
	// This typically corresponds to the `[locale]` segment
	const store = initializeLocaleConfigCache();
	const locale: Locale | undefined = (await getRequestLocale()) ?? store.defaultLocale;

	// Ensure that a valid locale is used
	if (!locale || !store.allowedLocales?.includes(locale)) {
		throw new Error("No locale found in request headers or cache.");
	}

	return {
		locale,
		messages: await loadLocaleMessages(locale),
	};
}

// Custom redirect function that maintains country code and locale
export function redirect(
	path: string,
	type: RedirectType = RedirectType.push, // or RedirectType.replace
	props?: {
		// countryCode?: string,
		locale?: string;
	},
) {
	if (path.startsWith("http")) {
		return nextRedirect(path, type);
	}

	const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
	const {
		// countryCode: currentCountryCode,
		locale: currentLocale,
		restPath,
	} = parsePathname(currentPath, initializeLocaleConfigCache());

	if (!currentLocale) {
		throw new Error(`!currentLocale`);
	}

	const targetLocale = props?.locale ?? currentLocale; // ?? defaultLocale;

	if (!restPath) {
		nextRedirect(targetLocale, type);
	}

	nextRedirect(`/${targetLocale}/${path}`, type);
}

export function permanentRedirect(
	path: string,
	type: RedirectType = RedirectType.push, // or RedirectType.replace
	props?: {
		// countryCode?: string,
		locale?: string;
	},
) {
	if (path.startsWith("http")) {
		return nextPermanentRedirect(path, type);
	}

	const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
	const {
		// countryCode: currentCountryCode,
		locale: currentLocale,
		restPath,
	} = parsePathname(currentPath, initializeLocaleConfigCache());

	if (!currentLocale) {
		throw new Error(`!currentLocale`);
	}

	const targetLocale = props?.locale ?? currentLocale; // ?? defaultLocale;

	if (!restPath) {
		nextPermanentRedirect(targetLocale, type);
	}

	nextPermanentRedirect(`/${targetLocale}/${path}`, type);
}
