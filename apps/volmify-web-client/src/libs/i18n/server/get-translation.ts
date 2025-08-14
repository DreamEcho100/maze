// import { currencyCodeFkCol } from "@de100/db/schema";
import { query } from "@solidjs/router";
import { getRequestEvent } from "solid-js/web";
import { type AllowedLocale, allowedLocales, defaultLocale } from "../constants";
import { getServerLocale, setLocaleInCookies } from "./utils";

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
	// console.log(currencyCodeFkCol);
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
		rpc: true,
	};
	// Skip middleware for static files and API routes
	if (
		pathnameFirstSegment &&
		((!props.direct && // Skip if not direct
			pathnameFirstSegment in notAllowedMap) || // Skip
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
