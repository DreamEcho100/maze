/** @import { UserAgent, MultiErrorSingleSuccessResponse, CookiesProvider, HeadersProvider } from "#types.ts" */

import { LOGOUT_MESSAGES_ERRORS, LOGOUT_MESSAGES_SUCCESS } from "#utils/constants.js";
import { getSessionId } from "#utils/get-session-id.js";
import { getCurrentAuthSession, invalidateOneAuthSessionToken } from "#utils/strategy/index.js";

/**
 * Handles logout by deleting the user session and clearing session cookies.
 *
 * @param {object} options
 * @param {CookiesProvider} options.cookies - The cookies provider to access the session token.
 * @param {HeadersProvider} options.headers - The headers provider to access the session token.
 * @param {string|null|undefined} options.ipAddress - Optional IP address for the session
 * @param {UserAgent|null|undefined} options.userAgent - Optional user agent for the session
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    LOGOUT_MESSAGES_ERRORS,
 *    LOGOUT_MESSAGES_SUCCESS
 *  >
 * >}
 */
export async function logoutService(options) {
	const { session } = await getCurrentAuthSession(options);
	// TODO: Just delete the session cookie instead of invalidating the session
	if (!session) {
		return LOGOUT_MESSAGES_ERRORS.AUTHENTICATION_REQUIRED;
	}

	const sessionId = getSessionId(session.token);
	await invalidateOneAuthSessionToken(
		{ where: { sessionId: sessionId } },
		{ shouldDeleteCookie: true, cookies: options.cookies },
	);

	return LOGOUT_MESSAGES_SUCCESS.LOGOUT_SUCCESS;
}
