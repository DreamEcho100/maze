/** @import { SessionValidationResult, DateLike } from "#types.ts" */

import { jwtProvider, sessionProvider } from "#providers/index.js";
import { createJWTAuth, getCurrentJWTAuth, logoutJWTAuth } from "./jwt.js";
import {
	createSession,
	deleteSessionTokenCookie,
	generateSessionToken,
	getCurrentSession,
	setSessionTokenCookie,
} from "./sessions.js";

// Get strategy from your auth config (you'll need to implement this)
function getAuthStrategy() {
	// This should come from your auth config
	// For now, return from environment or default
	return process.env.AUTH_STRATEGY ?? "session"; // 'session' | 'jwt'
}

/**
 * Strategy-aware session creation (replaces createSession)
 * @param {object} props
 * @param {object} props.data
 * @param {string} props.data.token - Session token OR will create JWT
 * @param {string} props.data.userId
 * @param {object} props.data.flags
 * @param {object} [options]
 */
export async function createAuthSession(props, options) {
	const strategy = getAuthStrategy();

	switch (strategy) {
		case "jwt":
			// For JWT, we don't use the token from props, we generate our own
			return await createJWTAuth(props, options);

		case "session":
		default:
			return await createSession(props, options);
	}
}

/**
 * Strategy-aware current session/auth retrieval (replaces getCurrentSession)
 * @returns {Promise<SessionValidationResult>}
 */
export async function getCurrentAuthSession() {
	const strategy = getAuthStrategy();

	switch (strategy) {
		case "jwt":
			return await getCurrentJWTAuth();

		case "session":
		default:
			return await getCurrentSession();
	}
}

/**
 * Strategy-aware token generation (replaces generateSessionToken)
 * @param {{ data: { userId: string } }} props
 * @returns {string}
 */
export function generateAuthSessionToken(props) {
	const strategy = getAuthStrategy();

	switch (strategy) {
		case "jwt":
			return jwtProvider.createRefreshToken(props);

		case "session":
		default:
			return generateSessionToken();
	}
}

/**
 * Strategy-aware token setting (replaces setSessionTokenCookie)
 * @param {object} param
 * @param {string} param.token - Token to set
 * @param {DateLike} param.expiresAt - Expiration
 * @param {string} [param.accessToken] - For JWT strategy
 * @param {string} [param.refreshToken] - For JWT strategy
 * @returns {object | void} - Returns tokens for JWT strategy
 */
export function setAuthSessionToken(param) {
	const strategy = getAuthStrategy();

	switch (strategy) {
		case "jwt":
			// For JWT, return tokens for client to handle
			return {
				accessToken: param.accessToken,
				refreshToken: param.refreshToken,
				accessExpiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 min
				refreshExpiresAt: param.expiresAt,
			};

		case "session":
		default:
			setSessionTokenCookie(param);
			return;
	}
}

/**
 * Strategy-aware token clearing (replaces deleteSessionTokenCookie)
 * @returns {void}
 */
export function deleteAuthSessionTokens() {
	const strategy = getAuthStrategy();

	switch (strategy) {
		case "jwt":
			// For JWT, no cookies to clear - client handles this
			return;

		case "session":
		default:
			deleteSessionTokenCookie();
			return;
	}
}

/**
 * Strategy-aware logout (replaces sessionProvider.deleteOneById)
 * @param {string} sessionId - Session ID or user ID
 * @param {string} [userId] - User ID for revoking all sessions
 * @returns {Promise<void>}
 */
export async function logoutAuth(sessionId, userId) {
	const strategy = getAuthStrategy();

	switch (strategy) {
		case "jwt":
			await logoutJWTAuth(userId ?? sessionId);
			break;

		case "session":
		default:
			if (userId) {
				await sessionProvider.invalidateAllByUserId({ where: { userId } });
			} else {
				await sessionProvider.deleteOneById(sessionId);
			}
			break;
	}
}

/**
 * Strategy-aware session invalidation (replaces sessionProvider.invalidateAllByUserId)
 * @param {object} props
 * @param {object} props.where
 * @param {string} props.where.userId
 * @param {object} [options]
 * @returns {Promise<void>}
 */
export async function invalidateAllUserAuth(props, options) {
	const strategy = getAuthStrategy();

	switch (strategy) {
		case "jwt":
			await sessionProvider.revokeAllByUserId(props, options);
			break;

		case "session":
		default:
			await sessionProvider.invalidateAllByUserId(props, options);
			break;
	}
}
