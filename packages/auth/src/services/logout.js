/** @import { UserAgent, MultiErrorSingleSuccessResponse } from "#types.ts" */

import { LOGOUT_MESSAGES_ERRORS, LOGOUT_MESSAGES_SUCCESS } from "#utils/constants.js";
import { getCurrentAuthSession, invalidateOneAuthSessionToken } from "#utils/strategy/index.js";

/**
 * Handles logout by deleting the user session and clearing session cookies.
 *
 * @param {object} options
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
	if (!session) {
		return LOGOUT_MESSAGES_ERRORS.AUTHENTICATION_REQUIRED;
	}

	await invalidateOneAuthSessionToken({ where: { sessionId: session.id } });

	return LOGOUT_MESSAGES_SUCCESS.LOGOUT_SUCCESS;
}
