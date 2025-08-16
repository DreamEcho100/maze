// import { currencyCodeFkCol } from "@de100/db/schema";
import { json, query } from "@solidjs/router";
import { getRequestEvent } from "solid-js/web";
import {
	type AllowedLocale,
	allowedLocales,
	defaultLocale,
} from "../constants";
import { getServerLocale, setLocaleInCookies } from "./utils";

export const getTranslation = query(async (registeredLocale?: string) => {
	if (process.env.NODE_ENV === "development") {
		console.log("___ getTranslation registeredLocale", registeredLocale);
	}
	// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
	const locale = (registeredLocale ||
		defaultLocale) as (typeof allowedLocales)[number];
	if (!allowedLocales.includes(locale)) {
		throw new Error(`Locale "${locale}" is not allowed.`);
	}

	const localeToMessagesPathMap = {
		ar: () => import("#libs/i18n/messages/ar.ts"),
		en: () => import("#libs/i18n/messages/en.ts"),
	} as const;

	return json(
		{
			translation: (await localeToMessagesPathMap[locale]()).default,
			locale,
		},
		{
			headers: {
				// IMP: <https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control>
				"cache-control": "max-age=31536000, stale-while-revalidate=86400", // 1 year max-age, allow stale for 1 day
			},
		},
	);

	// return (await localeToMessagesPathMap[locale]()).default;

	// switch (locale) {
	// 	case "ar":
	// 		return (await import("#libs/i18n/messages/ar.ts")).default;
	// 	default:
	// 		return (await import("#libs/i18n/messages/en.ts")).default;
	// }

	// // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
	// return (await import(`#libs/i18n/messages/${locale}.ts`)).default as Record<
	// 	Lowercase<string>,
	// 	LanguageMessages
	// >;
}, "translation");

export const getTranslationByLocal = async (props: {
	locale?: AllowedLocale;
	direct: boolean;
}) => {
	"use server";
	if (process.env.NODE_ENV === "development") {
		console.log("___ getTranslationByLocal props", props);
	}
	// console.log(currencyCodeFkCol);
	const requestEvent = getRequestEvent();
	if (!requestEvent) {
		throw new Error("No `requestEvent` found!");
	}

	requestEvent.clientAddress;

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
		((!props.direct && pathnameFirstSegment in notAllowedMap) || // Skip if `props.direct` is false and the first segment is in the notAllowedMap
			pathnameFirstSegment.includes(".")) // Skip if it contains a dot (e.g., file extensions)
	) {
		return;
	}

	let locale: AllowedLocale | undefined = props.locale;
	if (!locale) {
		const { foundLocale = defaultLocale, shouldSetCookie } = getServerLocale({
			nativeEvent: requestEvent.nativeEvent,
			headers: requestEvent.request.headers,
			pathname,
		});
		locale = foundLocale;

		if (shouldSetCookie) {
			setLocaleInCookies(requestEvent.nativeEvent, locale);
		}
	}

	return getTranslation(locale);
};
