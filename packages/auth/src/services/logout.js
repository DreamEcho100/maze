/** @import { UserAgent, MultiErrorSingleSuccessResponse, CookiesProvider, HeadersProvider, AuthStrategy, SessionsProvider } from "#types.ts" */

import { LOGOUT_MESSAGES_ERRORS, LOGOUT_MESSAGES_SUCCESS } from "#utils/constants.js";
import { getSessionId } from "#utils/get-session-id.js";
import { getCurrentAuthSession, invalidateOneAuthSessionToken } from "#utils/strategy/index.js";

/**
 * Handles logout by deleting the user session and clearing session cookies.
 *
 * @param {object} props
 * @param {CookiesProvider} props.cookies - The cookies provider to access the session token.
 * @param {HeadersProvider} props.headers - The headers provider to access the session token.
 * @param {string|null|undefined} props.ipAddress - Optional IP address for the session
 * @param {UserAgent|null|undefined} props.userAgent - Optional user agent for the session
 * @param {AuthStrategy} props.authStrategy
 * @param {{
 * 	sessions: {
 * 		findOneWithUser: SessionsProvider['findOneWithUser'];
 * 		deleteOneById: SessionsProvider['deleteOneById'];
 *		extendOneExpirationDate: SessionsProvider['extendOneExpirationDate'];
 * 		revokeOneById: SessionsProvider['revokeOneById'];
 * 	};
 * }} props.authProviders
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    LOGOUT_MESSAGES_ERRORS,
 *    LOGOUT_MESSAGES_SUCCESS
 *  >
 * >}
 */
export async function logoutService(props) {
	const { session } = await getCurrentAuthSession(
		{
			cookies: props.cookies,
			headers: props.headers,
			ipAddress: props.ipAddress,
			userAgent: props.userAgent,
		},
		{
			authStrategy: props.authStrategy,
			authProviders: {
				sessions: {
					deleteOneById: props.authProviders.sessions.deleteOneById,
					extendOneExpirationDate: props.authProviders.sessions.extendOneExpirationDate,
					findOneWithUser: props.authProviders.sessions.findOneWithUser,
				},
			},
		},
	);
	// TODO: Just delete the session cookie instead of invalidating the session
	if (!session) {
		return LOGOUT_MESSAGES_ERRORS.AUTHENTICATION_REQUIRED;
	}

	const sessionId = getSessionId(session.token);
	await invalidateOneAuthSessionToken(
		{ where: { sessionId: sessionId } },
		{
			shouldDeleteCookie: true,
			cookies: props.cookies,
			authStrategy: props.authStrategy,
			authProviders: {
				sessions: {
					deleteOneById: props.authProviders.sessions.deleteOneById,
					revokeOneById: props.authProviders.sessions.revokeOneById,
				},
			},
		},
	);

	return LOGOUT_MESSAGES_SUCCESS.LOGOUT_SUCCESS;
}
