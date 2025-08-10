import type { LanguageMessages } from "@de100/i18n";
import { match } from "@formatjs/intl-localematcher";
import { cache, redirect as solidRedirect } from "@solidjs/router";
import Negotiator from "negotiator";
import { getCookie, getHeader, setCookie } from "vinxi/http";
import { parsePathname } from "#utils";
import type { Locale } from "./config";
import { initializeLocaleConfigCache, updateLocaleConfigCache } from "./config";

// Used to read the locale from the middleware
export const I18N_HEADER_LOCALE_NAME = "X-DE100-I18N-LOCALE";

const getLocaleFromHeader = cache(async (): Promise<Locale | undefined> => {
	let locale: string | undefined;

	try {
		locale =
			getHeader(I18N_HEADER_LOCALE_NAME) ??
			getCookie(I18N_HEADER_LOCALE_NAME) ??
			undefined;
		if (locale) updateLocaleConfigCache({ locale });
	} catch (error) {
		console.error("Error getting locale from header:", error);
		throw error;
	}

	return locale;
}, "localeFromHeader");

export const getRequestLocale = cache(async () => {
	return initializeLocaleConfigCache().locale ?? (await getLocaleFromHeader());
}, "requestLocale");

export const getCurrentRequestConfig = cache(
	async (
		loadLocaleMessages: (
			locale: Locale,
		) => Promise<Record<string, LanguageMessages>>,
	) => {
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
	},
	"currentRequestConfig",
);

export function setRequestLocale(locale: Locale) {
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

// Custom redirect function that maintains locale
export function redirect(
	path: string,
	init?: ResponseInit,
	props?: {
		locale?: string;
	},
) {
	if (path.startsWith("http")) {
		return solidRedirect(path, init);
	}

	const { locale: currentLocale, restPath } = parsePathname(
		path,
		initializeLocaleConfigCache(),
	);

	if (!currentLocale) {
		throw new Error("!currentLocale");
	}

	const targetLocale = props?.locale ?? currentLocale;
	const targetPath = restPath
		? `/${targetLocale}${restPath}`
		: `/${targetLocale}`;

	return solidRedirect(targetPath, init);
}

export function permanentRedirect(
	path: string,
	init?: ResponseInit,
	props?: {
		locale?: string;
	},
) {
	return redirect(path, { ...init, status: 301 }, props);
}

export const getLocale = cache(async (): Promise<Locale> => {
	const locale = await getLocaleFromHeader();

	if (locale) {
		return locale;
	}

	const allowedLocales = initializeLocaleConfigCache().allowedLocales;
	const defaultLocale = initializeLocaleConfigCache().defaultLocale;

	if (!allowedLocales || !defaultLocale) {
		throw new Error("Allowed locales or default locale not set in config.");
	}

	const acceptLanguage = getHeader("accept-language") ?? "en-US,en;q=0.5";
	const headers = {
		"accept-language": acceptLanguage,
	};
	const languages = new Negotiator({ headers }).languages();

	return match(languages, allowedLocales, defaultLocale);
}, "locale");
