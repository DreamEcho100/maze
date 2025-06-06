/** @import { UserAgent, SessionValidationResult } from "#types.ts" */

import { authConfig } from "#init/index.js";
import { dateLikeToISOString } from "#utils/dates.js";
import { createJWTAuth, getCurrentJWTAuth } from "./jwt.js";
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
 * @param {string} [props.data.token] - Session token OR will create JWT
 * @param {string} props.data.userId
 * @param {string|null|undefined} props.data.ipAddress - Optional IP address for the session
 * @param {UserAgent|null|undefined} props.data.userAgent - Optional user agent for the session
 * @param {object} props.data.flags
 * @param {object} [options]
 */
export async function createAuthSession(props, options) {
	switch (authConfig.strategy) {
		case "jwt":
			// For JWT, we don't use the token from props, we generate our own
			return /** @type {const} */ ({
				strategy: "jwt",
				data: await createJWTAuth(props, options),
			});

		case "session": {
			/** @type {string} */
			const token = props.data.token ?? generateSessionToken();
			const session = await createSession({ ...props, data: { ...props.data, token } }, options);

			return /** @type {const} */ ({
				strategy: "session",
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
 * @param {string|null|undefined} options.ipAddress - Optional IP address for the session
 * @param {UserAgent|null|undefined} options.userAgent - Optional user agent for the session
 * @returns {Promise<SessionValidationResult>}
 */
export async function getCurrentAuthSession(options) {
	switch (authConfig.strategy) {
		case "jwt":
			return await getCurrentJWTAuth(options);

		case "session":
			return await getCurrentSession();

		default:
			throw new Error(`Unsupported auth strategy: ${authConfig.strategy}`);
	}
}

/**
 * Strategy-aware token generation (replaces generateSessionToken)
 * @param {{ data: { userId: string } }} props
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
 * @param {Awaited<ReturnType<typeof createAuthSession>>} param - Session data from createAuthSession
 */
export function setOneAuthSessionToken(param) {
	switch (param.strategy) {
		case "jwt": {
			return /** @type {const} */ ({
				strategy: "jwt",
				...param.data,
			});
		}

		case "session": {
			setSessionTokenCookie({ token: param.token, expiresAt: param.session.expiresAt });
			return /** @type {const} */ ({
				strategy: "session",
				sessionToken: param.token,
				expiresAt: dateLikeToISOString(param.expiresAt),
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
 */
export async function invalidateOneAuthSessionToken(props) {
	switch (authConfig.strategy) {
		case "jwt":
			// For JWT, no cookies to clear - client handles this, but we should still ensure the refresh token is invalidated/revoked
			return await authConfig.providers.session.revokeOneById(props.where.sessionId);

		case "session":
			await authConfig.providers.session.deleteOneById(props.where.sessionId);
			return deleteSessionTokenCookie();

		default:
			throw new Error(`Unsupported auth strategy: ${authConfig.strategy}`);
	}
}

/**
 * Strategy-aware session invalidation (replaces authConfig.providers.session.invalidateAllByUserId)
 * @param {object} props
 * @param {object} props.where
 * @param {string} props.where.userId
 * @param {object} [options]
 * @returns {Promise<void>}
 */
export async function invalidateAllUserAuth(props, options) {
	switch (authConfig.strategy) {
		case "jwt":
			await authConfig.providers.session.revokeAllByUserId(props, options);
			break;

		case "session":
			await authConfig.providers.session.deleteAllByUserId(props, options);
			break;

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

// 	if (result.session.sessionType === "jwt_refresh_token") {
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
