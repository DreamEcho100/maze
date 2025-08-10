import { match } from "@formatjs/intl-localematcher";
import type { FetchEvent } from "@solidjs/start/server";
import Negotiator from "negotiator";
import { I18N_HEADER_LOCALE_NAME } from ".";
import type { Locale } from "./config";

interface I18nMiddlewareConfig {
	allowedLocales: Locale[];
	defaultLocale: Locale;
	cookieName?: string;
	headerName?: string;
}

export function createI18nMiddleware(config: I18nMiddlewareConfig) {
	const {
		allowedLocales,
		defaultLocale,
		cookieName = I18N_HEADER_LOCALE_NAME,
		headerName = I18N_HEADER_LOCALE_NAME,
	} = config;

	return (event: FetchEvent) => {
		const { request } = event;
		const url = new URL(request.url);
		const pathname = url.pathname;

		// Skip middleware for static files and API routes
		if (
			pathname.startsWith("/_build/") ||
			pathname.startsWith("/assets/") ||
			pathname.startsWith("/api/") ||
			pathname.includes(".")
		) {
			return;
		}

		// Check if locale is already in the URL
		const pathnameLocale = allowedLocales.find(
			(locale) =>
				pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
		);

		if (pathnameLocale) {
			// Locale found in URL, set header and continue
			const response = new Response(null, {
				headers: {
					[headerName]: pathnameLocale,
				},
			});
			return response;
		}

		// No locale in URL, determine locale from headers/cookies
		let locale = defaultLocale;

		// Try to get locale from cookie first
		const cookieHeader = request.headers.get("cookie");
		if (cookieHeader) {
			const cookies = new Map(
				cookieHeader.split(";").map((cookie) => {
					const [key, value] = cookie.trim().split("=");
					return [key, value];
				}),
			);
			const cookieLocale = cookies.get(cookieName);
			if (cookieLocale && allowedLocales.includes(cookieLocale)) {
				locale = cookieLocale;
			}
		}

		// If no valid cookie locale, use Accept-Language header
		if (locale === defaultLocale) {
			const acceptLanguage = request.headers.get("accept-language");
			if (acceptLanguage) {
				const languages = new Negotiator({
					headers: { "accept-language": acceptLanguage },
				}).languages();
				locale = match(languages, allowedLocales, defaultLocale);
			}
		}

		// Redirect to URL with locale prefix
		const redirectUrl = new URL(url);
		redirectUrl.pathname = `/${locale}${pathname}`;

		return Response.redirect(redirectUrl.toString(), 302);
	};
}
