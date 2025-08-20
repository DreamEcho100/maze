// @ts-check

/**
 * @import { AuthProvidersShape, AuthProvidersWithGetSessionProviders, AuthProvidersWithGetSessionUtils, CookiesProvider, DynamicCookiesOptions, HeadersProvider, UserAgent } from "@de100/auth-core/types";
 */
import { dateLikeToDate } from "@de100/auth-core/utils/dates";
import {
	authStrategy,
	createOneIdSync,
	defaultSessionsHandlers,
} from "@de100/db/auth/init";
import { getRequestEvent } from "solid-js/web";
import { deleteCookie, getCookie, setCookie } from "vinxi/http";

/**
 * Retrieves the client's IP address and user agent from the request headers.
 *
 * @param {Headers} [reqHeaders] - Optional request headers object.
 * @returns {{ ipAddress: string | null, userAgent: UserAgent; cookies: CookiesProvider; headers: HeadersProvider; cookiesOptions: DynamicCookiesOptions }} An object containing the IP address and user agent.
 */
export function getSessionOptionsBasics(reqHeaders) {
	"use server";
	const { cookies, headers } = getCookiesAndHeaders(reqHeaders);

	let ipAddress = null;
	const forwardedFor = headers.get("x-forwarded-for");
	if (forwardedFor) {
		// x-forwarded-for can contain multiple IPs, we take the first one
		ipAddress = forwardedFor.split(",")[0]?.trim() ?? null;
	}
	const realIp = headers.get("x-real-ip");
	if (realIp) {
		ipAddress = realIp.trim();
	}

	// Parse user agent manually since we don't have Next.js userAgent helper
	const userAgentString = headers.get("user-agent") ?? "";
	const userAgent = parseUserAgent(userAgentString);

	/** @type {DynamicCookiesOptions} */
	const cookiesOptions = {};

	return { ipAddress, userAgent, cookies, headers, cookiesOptions };
}

import { UAParser } from "ua-parser-js";

/**
 * Simple user agent parser (you might want to use a library like 'ua-parser-js' for better parsing)
 * @param {string} userAgentString
 * @returns {UserAgent}
 */
function parseUserAgent(userAgentString) {
	"use server";
	const parser = new UAParser(userAgentString);
	const result = parser.getResult();

	return {
		isBot: false, // Assuming we don't want to treat this as a bot
		ua: userAgentString,
		browser: {
			name: result.browser.name,
			version: result.browser.version,
		},
		device: {
			type: result.device.type,
			model: result.device.model,
		},
		engine: {
			name: result.engine.name,
			version: result.engine.version,
		},
		os: {
			name: result.os.name,
			version: result.os.version,
		},
		cpu: {
			architecture: result.cpu.architecture,
		},
	};
}
// function parseUserAgent(userAgentString) {
// 	// Basic parsing - you might want to use a proper library like 'ua-parser-js'
// 	const browser = {};
// 	const device = {};
// 	const engine = {};
// 	const os = {};
// 	const cpu = {};

// 	// Simple browser detection
// 	if (userAgentString.includes("Chrome")) {
// 		browser.name = "Chrome";
// 		const match = userAgentString.match(/Chrome\/(\d+)/);
// 		if (match) browser.version = match[1];
// 	} else if (userAgentString.includes("Firefox")) {
// 		browser.name = "Firefox";
// 		const match = userAgentString.match(/Firefox\/(\d+)/);
// 		if (match) browser.version = match[1];
// 	} else if (userAgentString.includes("Safari")) {
// 		browser.name = "Safari";
// 		const match = userAgentString.match(/Version\/(\d+)/);
// 		if (match) browser.version = match[1];
// 	}

// 	// Simple OS detection
// 	if (userAgentString.includes("Windows")) {
// 		os.name = "Windows";
// 	} else if (userAgentString.includes("Mac")) {
// 		os.name = "macOS";
// 	} else if (userAgentString.includes("Linux")) {
// 		os.name = "Linux";
// 	}

// 	return {
// 		ua: userAgentString,
// 		browser,
// 		device,
// 		engine,
// 		os,
// 		cpu,
// 	};
// }

/** @returns {CookiesProvider} */
export function getCookiesManager() {
	"use server";
	const requestEvent = getRequestEvent();
	if (!requestEvent) {
		throw new Error(
			"No request event found. Ensure this is called within a request context.",
		);
	}

	const nativeEvent = requestEvent.nativeEvent;

	return {
		get: (name) => getCookie(nativeEvent, name),
		set: (name, value, { expires, ...options } = {}) =>
			setCookie(nativeEvent, name, value, {
				...options,
				expires: expires ? dateLikeToDate(expires) : undefined,
			}),
		delete: (name, { expires, ...options } = {}) =>
			deleteCookie(nativeEvent, name, {
				...options,
				expires: expires ? dateLikeToDate(expires) : undefined,
			}),
	};
}

/**
 * Retrieves cookies and headers for SolidStart
 *
 * @param {Headers} [reqHeaders] - Optional request headers object.
 */
export function getCookiesAndHeaders(reqHeaders) {
	"use server";
	const requestEvent = getRequestEvent();
	if (!requestEvent) {
		throw new Error(
			"No request event found. Ensure this is called within a request context.",
		);
	}

	const cookies = getCookiesManager();
	const headers = reqHeaders ?? requestEvent.request.headers;

	return { cookies, headers };
}

/**
 * @param {AuthProvidersWithGetSessionProviders} authProvidersFromInput
 */
export function getDefaultSessionAndJWTFromAuthProviders(
	authProvidersFromInput,
) {
	"use server";

	return {
		...authProvidersFromInput,
		sessions: {
			...authProvidersFromInput.sessions,
			deleteOneById: authProvidersFromInput.sessions.deleteOneById,
			extendOneExpirationDate:
				authProvidersFromInput.sessions.extendOneExpirationDate,
			findOneWithUser: authProvidersFromInput.sessions.findOneWithUser,
			revokeOneById: authProvidersFromInput.sessions.revokeOneById,
			createOne: authProvidersFromInput.sessions.createOne,
		},
		jwt: {
			...authProvidersFromInput.jwt,
			verifyAccessToken: authProvidersFromInput.jwt?.verifyAccessToken,
			createRefreshToken: authProvidersFromInput.jwt?.createRefreshToken,
			verifyRefreshToken: authProvidersFromInput.jwt?.verifyRefreshToken,
			createAccessToken: authProvidersFromInput.jwt?.createAccessToken,
		},
	};
}

// /**
//  * @param {{
//  * 	authProviders?: Partial<AuthProvidersWithGetSessionUtils>;
//  * 	canMutateCookies?: boolean;
//  * }} props
//  * @returns {Parameters<typeof getCurrentAuthSession>[0]} props
//  */
// export function generateGetCurrentAuthSessionProps({ canMutateCookies = true, authProviders }) {
// 	// const userAgent = /** @type {UserAgent | null} */ (
// 	// 	props.userAgent
// 	// 		? typeof props.userAgent === "function"
// 	// 			? props.userAgent()
// 	// 			: props.userAgent
// 	// 		: null
// 	// );
// 	// const ipAddress = /** @type {string | null} */ (
// 	// 	props.ipAddress
// 	// 		? typeof props.ipAddress === "function"
// 	// 			? props.ipAddress()
// 	// 			: props.ipAddress
// 	// 		: null
// 	// );
// 	const { ipAddress, userAgent, cookies, headers, cookiesOptions } = getSessionOptionsBasics();

// 	return {
// 		ipAddress: ipAddress,
// 		userAgent: userAgent,
// 		cookies: cookies,
// 		cookiesOptions: cookiesOptions ?? {},
// 		headers: headers,
// 		// tx: props.tx,
// 		authStrategy: authStrategy,
// 		canMutateCookies: canMutateCookies,
// 		generateRandomId: () => crypto.randomUUID(),
// 		authProviders: getDefaultSessionAndJWTFromAuthProviders({
// 			...authProviders,
// 			sessions: {
// 				...defaultSessionsHandlers,
// 				...authProviders?.session,
// 			},
// 		}),
// 		// user: props.user,
// 		// session: props.session,
// 		// sessionMetadata: props.sessionMetadata,
// 	};
// }

/**
 * @template {Partial<AuthProvidersWithGetSessionUtils> & {
 * 	authProviders?: AuthProvidersShape
 * 	reqHeaders?: Headers;
 * }} TProps
 * @param {TProps} props
 */
export async function generateGetCurrentAuthSessionProps(props) {
	"use server";
	const input = {
		...(await getSessionOptionsBasics(props.reqHeaders)),
		cookiesOptions: props.cookiesOptions ?? {},
		canMutateCookies: true,
		...props,
		authStrategy: authStrategy,
		generateRandomId: createOneIdSync,
		authProviders: {
			...props.authProviders,
			sessions: {
				...props.authProviders?.sessions,
				deleteOneById: defaultSessionsHandlers.deleteOneById,
				extendOneExpirationDate:
					defaultSessionsHandlers.extendOneExpirationDate,
				findOneWithUser: defaultSessionsHandlers.findOneWithUser,
				revokeOneById: defaultSessionsHandlers.revokeOneById,
				createOne: defaultSessionsHandlers.createOne,
			},
			jwt: {
				...props.authProviders?.jwt,
				// createRefreshToken: props.authProviders?.jwt?.createRefreshToken,
				// verifyRefreshToken: props.authProviders?.jwt?.verifyRefreshToken,
				// createAccessToken: props.authProviders?.jwt?.createAccessToken,
				// verifyAccessToken: props.authProviders?.jwt?.verifyAccessToken,
			},
		},
	};

	return input;
}
