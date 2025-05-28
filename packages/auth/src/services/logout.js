/** @import { MultiErrorSingleSuccessResponse } from "#types.ts" */

import { sessionProvider } from "#providers/index.js";
import { LOGOUT_MESSAGES_ERRORS, LOGOUT_MESSAGES_SUCCESS } from "#utils/constants.js";
import { deleteAuthSessionTokens, getCurrentAuthSession } from "#utils/startegy/index.js";

/**
 * Handles logout by deleting the user session and clearing session cookies.
 *
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    LOGOUT_MESSAGES_ERRORS,
 *    LOGOUT_MESSAGES_SUCCESS
 *  >
 * >}
 */
export async function logoutService() {
	const { session } = await getCurrentAuthSession();
	if (!session) {
		return LOGOUT_MESSAGES_ERRORS.AUTHENTICATION_REQUIRED;
	}

	await sessionProvider.deleteOneById(session.id);

	deleteAuthSessionTokens();

	return LOGOUT_MESSAGES_SUCCESS.LOGOUT_SUCCESS;
}
