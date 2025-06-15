/** @import { MultiErrorSingleSuccessResponse, AuthProvidersWithGetSessionProviders, AuthProvidersWithGetSessionUtils } from "#types.ts" */

import { LOGOUT_MESSAGES_ERRORS, LOGOUT_MESSAGES_SUCCESS } from "#utils/constants.js";
import { generateGetCurrentAuthSessionProps } from "#utils/generate-get-current-auth-session-props.js";
import { getCurrentAuthSession, invalidateOneAuthSessionToken } from "#utils/sessions/index.js";

/**
 * Handles logout by deleting the user session and clearing session cookies.
 *
 * @param {AuthProvidersWithGetSessionUtils & {
 * 	authProviders: AuthProvidersWithGetSessionProviders
 * 	input: unknown;
 * }} props
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    LOGOUT_MESSAGES_ERRORS,
 *    LOGOUT_MESSAGES_SUCCESS
 *  >
 * >}
 */
export async function logoutService(props) {
	const getSessionInput = await generateGetCurrentAuthSessionProps(props);
	const { session } = await getCurrentAuthSession(getSessionInput);
	// TODO: Just delete the session cookie instead of invalidating the session
	if (!session) {
		return LOGOUT_MESSAGES_ERRORS.AUTHENTICATION_REQUIRED;
	}

	await invalidateOneAuthSessionToken(getSessionInput);

	return LOGOUT_MESSAGES_SUCCESS.LOGOUT_SUCCESS;
}
