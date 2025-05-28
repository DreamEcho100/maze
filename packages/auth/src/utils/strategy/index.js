/** @import { SessionValidationResult, DateLike, Session } from "#types.ts" */

import { getAuthStrategy, jwtProvider, sessionProvider } from "#providers/index.js";
import { dateLikeToISOString } from "#utils/dates.js";
import { createJWTAuth, getCurrentJWTAuth, logoutJWTAuth } from "./jwt.js";
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
 * @param {object} props.data.flags
 * @param {object} [options]
 */
export async function createAuthSession(props, options) {
	const strategy = getAuthStrategy();

	switch (strategy) {
		case "jwt":
			// For JWT, we don't use the token from props, we generate our own
			return /** @type {const} */ ({
				strategy: "jwt",
				data: await createJWTAuth(props, options),
			});
		case "session": {
			/** @type {string} */
			let token = props.data.token ?? generateSessionToken();

			return /** @type {const} */ ({
				strategy: "session",
				token: token, // ✅ Use the local token variable
				session: await createSession({ ...props, data: { ...props.data, token } }, options),
			});
		}
		default:
			throw new Error(`Unsupported auth strategy: ${strategy}`);
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
			return generateSessionToken();
		default:
			throw new Error(`Unsupported auth strategy: ${strategy}`);
	}
}

/**
 * Strategy-aware token setting (replaces setSessionTokenCookie)
 * @param {object} param
 * @param {string} param.token - Token to set
 * @param {Awaited<ReturnType<typeof createAuthSession>>} param.data - Session data from createAuthSession
 */
export function setAuthSessionToken(param) {
	const strategy = getAuthStrategy();

	switch (param.data.strategy) {
		case "jwt": {
			return /** @type {const} */ ({
				strategy: "jwt",
				...param.data.data,
			});
		}

		case "session": {
			setSessionTokenCookie({ token: param.token, expiresAt: param.data.session.expiresAt });
			return /** @type {const} */ ({
				strategy: "session",
				sessionToken: param.token,
				expiresAt: dateLikeToISOString(param.data.session.expiresAt),
			});
		}

		default:
			throw new Error(`Unsupported auth strategy: ${strategy}`);
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
