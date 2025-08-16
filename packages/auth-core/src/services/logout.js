/** @import { MultiErrorSingleSuccessResponse, SessionsProvider, AuthStrategy, CookiesProvider, DynamicCookiesOptions, ValidSessionResult } from "#types.ts" */

import {
	LOGOUT_MESSAGES_ERRORS,
	LOGOUT_MESSAGES_SUCCESS,
} from "#utils/constants.js";
import { invalidateOneAuthSessionToken } from "#utils/sessions/index.js";

/**
 * Handles logout by deleting the user session and clearing session cookies.
 *
 * @param {{
 * 	authProviders: { sessions: { revokeOneById: SessionsProvider['revokeOneById'] }; }
 * 	shouldDeleteCookie?: boolean;
 *  authStrategy: AuthStrategy;
 * 	cookies: CookiesProvider;
 * 	cookiesOptions?: DynamicCookiesOptions;
 * 	session: ValidSessionResult["session"];
 * }} props
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    LOGOUT_MESSAGES_ERRORS,
 *    LOGOUT_MESSAGES_SUCCESS
 *  >
 * >}
 */
export async function logoutService(props) {
	await invalidateOneAuthSessionToken({
		authProviders: {
			sessions: {
				revokeOneById: props.authProviders.sessions.revokeOneById,
			},
		},
		authStrategy: props.authStrategy,
		cookies: props.cookies,
		cookiesOptions: props.cookiesOptions,
		session: props.session,
		shouldDeleteCookie: props.shouldDeleteCookie,
	});

	return LOGOUT_MESSAGES_SUCCESS.LOGOUT_SUCCESS;
}
