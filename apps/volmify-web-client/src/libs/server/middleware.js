/**
 * @import { NextRequest } from "next/server"
 * @import { ClientSession, User } from "@de100/auth-core/types"
 * @import { AllowedLocale } from "#i18n/constants"
 */

// import { NextResponse } from "next/server";
import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
// import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// import {
// 	I18N_HEADER_LOCALE_NAME,
// 	setRequestLocale,
// } from "node_modules/@de100/i18n-nextjs/src/server";

// import { csrfProtection } from "@de100/auth-core/utils/csrf";
import { updateLocaleConfigCache } from "@de100/i18n-nextjs/server/init";

import { allowedLocales, defaultLocale } from "#i18n/constants";
import { getRequestLocale, setRequestLocale } from "#i18n/server";
import { getCurrentSession } from "#libs/auth/server/queries.js";

/*
Cannot find module 'auth-base-server/' or its corresponding type declarations.ts(2307)
⚠ Error (TS2307)  | 
Cannot find module 
 or its corresponding type declarations.
*/

/**
 * @param {NextRequest} request
 * @param {{
 *  onAuthorized?: (result: { session: ClientSession; user: User }) => NextResponse | Promise<NextResponse>;
 *  onUnauthorized?: () => NextResponse | Promise<NextResponse>;
 *  onInvalidCSRF?: () => NextResponse | Promise<NextResponse>;
 *  onValidCSRF?: () => NextResponse | Promise<NextResponse>;
 *  onError?: (error: unknown) => NextResponse | Promise<NextResponse>;
 * }} [options] Handlers for different middleware states, including authorization,
 *  CSRF validation, and errors.
 * @returns {Promise<NextResponse>} - Returns the appropriate Next.js response based on the
 *  middleware state (authorized, unauthorized, CSRF validation, error).
 *
 * @example
 * ```ts
 * import { createAuthMiddleware } from "@de100/auth-core/middleware";
 *
 * export default async function middleware(request, next) {
 *   return createAuthMiddleware(request, {
 *     onAuthorized: ({ session, user }) => {
 *       console.log("Authorized", session, user);
 *       return next(request);
 *     },
 *     onUnauthorized: () => {
 *       console.log("Unauthorized");
 *       return new NextResponse(null, { status: 401 });
 *     },
 *     onInvalidCSRF: () => {
 *       console.log("Invalid CSRF");
 *       return new NextResponse(null, { status: 403 });
 *     },
 *     onValidCSRF: () => {
 *       console.log("Valid CSRF");
 *       return next(request);
 *     },
 *     onError: (error) => {
 *       console.error("Error", error);
 *       return new NextResponse(null, { status: 500 });
 *     },
 *   });
 * }
 * ```
 */
export async function createAuthMiddleware(request, options) {
	const authedRequest = await handleAuthMiddleware(request);

	switch (authedRequest.status) {
		case "authorized":
			// return authedRequest.result;
			return (
				options?.onAuthorized?.(authedRequest.result) ?? NextResponse.next()
			);
		case "unauthorized":
			return (
				options?.onUnauthorized?.() ?? new NextResponse(null, { status: 401 })
			);
		case "invalid-csrf":
			// return new NextResponse(null, { status: 403 });
			return (
				options?.onInvalidCSRF?.() ?? new NextResponse(null, { status: 403 })
			);
		case "valid-csrf":
			// return NextResponse.next();
			return options?.onValidCSRF?.() ?? NextResponse.next();
		case "error":
			// return new NextResponse(null, { status: 500 });
			return (
				options?.onError?.(authedRequest.error) ??
				new NextResponse(null, { status: 500 })
			);
	}
}

/**
 * Handles the core session validation and CSRF protection logic for the middleware.
 *
 * @param {NextRequest} request - The incoming HTTP request object.
 *
 * @returns {Promise<
 *  { status: "authorized", result: { session: ClientSession, user: User }} |
 *  { status: "unauthorized", result: null } |
 *  { status: "invalid-csrf", result: null } |
 *  { status: "valid-csrf", result: null } |
 *  { status: "error", error: unknown }
 * >} - The middleware result, containing the status (authorized, unauthorized, etc.) and
 *  the relevant session or error data.
 */
async function handleAuthMiddleware(request) {
	try {
		// Handle session token for GET requests
		if (request.method === "GET") {
			// const response = NextResponse.next();

			// const result = await handleSessionMiddleware({
			// 	token,
			// 	// eslint-disable-next-line @typescript-eslint/unbound-method
			// 	setCookie: response.cookies.set,
			// });
			const result = await getCurrentSession();

			if (result.session) {
				return { status: "authorized", result };
			}

			return { status: "unauthorized", result: null };
		}

		// CSRF Protection for non-GET requests
		const originHeader = request.headers.get("Origin");
		const hostHeader = request.headers.get("Host");

		if (!csrfProtection(originHeader, hostHeader)) {
			return { status: "invalid-csrf", result: null };
		}

		return { status: "valid-csrf", result: null };
	} catch (error) {
		return { status: "error", error };
	}
}

// import createIntlMiddleware from "next-intl/middleware";

// import type { AllowedLocale } from "./libs/i18n/navigation/type";
// import { env } from "./env";
// import { defaultLocale, locales } from "./libs/i18n/constants";

// Get the preferred locale, similar to the above or using a library
/** @param {NextRequest} request  */
async function getLocale(request) {
	const cookiesManager = await cookies();
	const locale = cookiesManager.get("NEXT_LOCALE")?.value;

	if (locale) {
		return locale;
	}

	const headers = {
		"accept-language":
			(await getRequestLocale()) ??
			request.headers.get("accept-language") ??
			"en-US,en;q=0.5",
	};
	const languages = new Negotiator({ headers }).languages();

	return match(languages, allowedLocales, defaultLocale); // -> 'en-US'
}

/** @param {NextRequest} request  */
export async function customCreateIntlMiddleware(request) {
	// Check if there is any supported locale in the pathname
	const { pathname } = request.nextUrl;

	let locale = allowedLocales.find(
		(locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
	);

	if (locale) {
		// (await cookies()).set(I18N_HEADER_LOCALE_NAME, locale);
		// await setRequestLocale(locale, request.headers);
		return NextResponse.next();
	}

	updateLocaleConfigCache({
		locale: defaultLocale,
		allowedLocales,
		defaultLocale,
	});
	// Redirect if there is no locale
	const reqLocale = await getLocale(request);
	locale = reqLocale
		? allowedLocales.find(
				/** @returns {cur is AllowedLocale} */
				(cur) => reqLocale.startsWith(cur),
			)
		: defaultLocale;

	if (!locale) {
		throw new Error("");
	}

	// (await cookies()).set(I18N_HEADER_LOCALE_NAME, locale);
	setRequestLocale(locale, request.headers);
	request.nextUrl.pathname = `/${locale}${pathname}`;

	// e.g. incoming request is /products
	// The new URL is now /en-US/products
	return Response.redirect(request.nextUrl);
}
