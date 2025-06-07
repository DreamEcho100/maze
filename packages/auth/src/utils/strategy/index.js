/** @import { User, UserAgent, SessionValidationResult, SessionMetadata, CookiesProvider, HeadersProvider } from "#types.ts" */

import { authConfig } from "#init/index.js";
// import { dateLikeToISOString } from "#utils/dates.js";
import { isDeviceMobileOrTablet } from "#utils/is-device-mobile-or-tablet.js";
import {
	createJWTAuth,
	deleteJWTTokenCookies,
	getCurrentJWTAuth,
	setJWTTokenCookies,
} from "./jwt.js";
import {
	createSession,
	deleteSessionTokenCookie,
	generateSessionToken,
	getCurrentSession,
	setSessionTokenCookie,
} from "./sessions.js";

/**
 * Strategy-aware session creation (replaces createSession)
 * @param {object} props
 * @param {object} props.data
 * @param {string} [props.data.token] - ClientSession token OR will create JWT
 * @param {User} props.data.user
 * @param {SessionMetadata} props.data.metadata - Optional IP address for the session
 * @param {object} [options]
 */
export async function createAuthSession(props, options) {
	switch (authConfig.strategy) {
		case "jwt": {
			// For JWT, we don't use the token from props, we generate our own
			const data = await createJWTAuth(
				{
					data: {
						metadata: props.data.metadata,
						user: props.data.user,
					},
				},
				options,
			);

			return /** @type {const} */ ({
				strategy: "jwt",
				data,
			});
		}

		case "session": {
			/** @type {string} */
			const token = props.data.token ?? generateSessionToken();
			const { session, user } = await createSession(
				{
					...props,
					data: {
						token,
						flags: {
							twoFactorVerifiedAt: props.data.metadata.twoFactorVerifiedAt ?? null,
						},
						ipAddress: props.data.metadata.ipAddress ?? null,
						userAgent: props.data.metadata.userAgent ?? null,
						userId: props.data.user.id,
					},
				},
				options,
			);

			return /** @type {const} */ ({
				strategy: "session",
				data: { user, session },
				token: token,
				session: session,
				expiresAt: session.expiresAt,
			});
		}

		default:
			throw new Error(`Unsupported auth strategy: ${authConfig.strategy}`);
	}
}

/**
 * Strategy-aware current session/auth retrieval (replaces getCurrentSession)
 * @param {object} options
 * @param {CookiesProvider} options.cookies - The cookies provider to access the session token.
 * @param {HeadersProvider} options.headers - The headers provider to access the session token.
 * @param {string|null|undefined} options.ipAddress - Optional IP address for the session
 * @param {UserAgent|null|undefined} options.userAgent - Optional user agent for the session
 * @returns {Promise<SessionValidationResult>}
 */
export async function getCurrentAuthSession(options) {
	switch (authConfig.strategy) {
		case "jwt":
			return await getCurrentJWTAuth(options);

		case "session":
			return await getCurrentSession(options.cookies);

		default:
			throw new Error(`Unsupported auth strategy: ${authConfig.strategy}`);
	}
}

/**
 * Strategy-aware token generation (replaces generateSessionToken)
 * @param {{ data: { user: User; metadata: SessionMetadata } }} props
 * @returns {string}
 */
export function generateAuthSessionToken(props) {
	switch (authConfig.strategy) {
		case "jwt":
			return authConfig.jwt.createRefreshToken(props);

		case "session":
			return generateSessionToken();

		default:
			throw new Error(`Unsupported auth strategy: ${authConfig.strategy}`);
	}
}

/**
 * @typedef {Awaited<ReturnType<typeof createAuthSession>>} CreateAuthSessionResult
 *
 * @typedef {Exclude<CreateAuthSessionResult, { strategy: "jwt" }>} SessionAuthResult
 * @typedef {Exclude<CreateAuthSessionResult, { strategy: "session" }>} JwtAuth
 */

/**
 * Strategy-aware token setting (replaces setSessionTokenCookie)
 * @param {Awaited<ReturnType<typeof createAuthSession>>} param - ClientSession data from createAuthSession
 * @param {object} options
 * @param {CookiesProvider} options.cookies - The cookies provider to access the session token.
 * @param {UserAgent|null|undefined} options.userAgent - User agent for the session
 */
export function setOneAuthSessionToken(param, options) {
	switch (param.strategy) {
		case "jwt": {
			if (options.userAgent && isDeviceMobileOrTablet(options.userAgent)) {
				return /** @type {const} */ ({
					strategy: "jwt",
					platform: "mobile/tablet",
					accessToken: param.data.metadata.accessToken,
					accessExpiresAt: param.data.metadata.accessExpiresAt,
					refreshToken: param.data.metadata.refreshToken,
					refreshExpiresAt: param.data.metadata.refreshExpiresAt,
				});
			}

			// For web, we set the session token cookie
			setJWTTokenCookies(
				{
					accessToken: param.data.metadata.accessToken,
					accessExpiresAt: param.data.metadata.accessExpiresAt,
					refreshToken: param.data.metadata.refreshToken,
					refreshExpiresAt: param.data.metadata.refreshExpiresAt,
				},
				options.cookies,
			);
			return /** @type {const} */ ({
				strategy: "jwt",
				platform: "web",
				// accessToken: param.data.metadata.accessToken,
				accessExpiresAt: param.data.metadata.accessExpiresAt,
				refreshExpiresAt: param.data.metadata.refreshExpiresAt,
			});
		}

		case "session": {
			if (options.userAgent && isDeviceMobileOrTablet(options.userAgent)) {
				return /** @type {const} */ ({
					strategy: "session",
					platform: "mobile/tablet",
					sessionToken: param.token,
					expiresAt: param.expiresAt,
				});
			}

			setSessionTokenCookie(
				{ token: param.token, expiresAt: param.session.expiresAt },
				options.cookies,
			);
			return /** @type {const} */ ({
				strategy: "session",
				platform: "web",
				expiresAt: param.expiresAt,
			});
		}

		default:
			throw new Error(`Unsupported auth strategy: ${authConfig.strategy}`);
	}
}

/**
 * Strategy-aware token clearing (replaces deleteSessionTokenCookie)
 *
 * @param {{ where: { sessionId: string } }} props
 * @param {{ shouldDeleteCookie?: boolean; cookies: CookiesProvider }} options
 */
export async function invalidateOneAuthSessionToken(props, options) {
	const { shouldDeleteCookie: deleteCookie = true } = options;

	switch (authConfig.strategy) {
		case "jwt":
			if (deleteCookie) deleteJWTTokenCookies(options.cookies);
			return await authConfig.providers.session.revokeOneById(props.where.sessionId);

		case "session":
			if (deleteCookie) deleteSessionTokenCookie(options.cookies);
			return await authConfig.providers.session.deleteOneById(props.where.sessionId);

		default:
			throw new Error(`Unsupported auth strategy: ${authConfig.strategy}`);
	}
}

/**
 * Strategy-aware session invalidation (replaces authConfig.providers.session.invalidateAllByUserId)
 * @param {object} props
 * @param {object} props.where
 * @param {string} props.where.userId
 * @param {object} options
 * @param {any} options.tx - Optional transaction object for database operations
 * @param {CookiesProvider} options.cookies - The cookies provider to access the session token.
 * @returns {Promise<void>}
 */
export async function invalidateAllUserAuth(props, options) {
	switch (authConfig.strategy) {
		case "jwt":
			await authConfig.providers.session.revokeAllByUserId(props, options);
			return deleteJWTTokenCookies(options.cookies);

		case "session":
			await authConfig.providers.session.deleteAllByUserId(props, options);
			return deleteSessionTokenCookie(options.cookies);

		default:
			throw new Error(`Unsupported auth strategy: ${authConfig.strategy}`);
	}
}

// /**
//  * Middleware to handle session token validation and cookie expiration extension.
//  *
//  * @returns {Promise<SessionValidationResult>} The result of session validation.
//  */
// export async function handleSessionMiddleware() {
// 	const result = await getCurrentAuthSession();

// 	if (!result.session) {
// 		return { session: null, user: null };
// 	}

// 	if (result.session.sessionType === "jwt_access_token") {
// 		// For JWT, we don't set cookies, just return the data
// 		return result;
// 	}

// 	// For session authConfig.strategy, we set the cookie
// 	// Set the session token cookie with the new expiration date
// 	const token = getTokenFromCookies();
// 	if (!token) {
// 		return { session: null, user: null };
// 	}
// 	setOneAuthSessionToken({
// 		strategy: "session",
// 		session: result.session,
// 		token: token,
// 		expiresAt: new Date(Date.now() + COOKIE_TOKEN_SESSION_EXPIRES_DURATION),
// 	});

// 	return result;
// }
