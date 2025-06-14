/** @import { AuthProvidersWithSessionAndJWTDefaults, AuthStrategy, CookiesProvider, HeadersProvider, SessionsProvider, UserAgent } from "#types.ts" */

import { getDefaultSessionAndJWTFromAuthProviders } from "#utils/get-defaults-session-and-jwt-from-auth-providers.js";
import { deleteAuthTokenCookies } from "./cookies";
import { getCurrentAuthSession } from "./get-current-auth-session";

/**
 * Strategy-aware token clearing (replaces deleteSessionTokenCookie)
 *
 * @param {object} props
 * @param {boolean} [props.shouldDeleteCookie]
 * @param {any} props.tx
 * @param {CookiesProvider} props.cookies - The cookies provider to access the session token.
 * @param {HeadersProvider} props.headers - The headers provider to access the session token.
 * @param {string|null|undefined} props.ipAddress - Optional IP address for the session
 * @param {UserAgent|null|undefined} props.userAgent - Optional user agent for the session
 * @param {AuthStrategy} props.authStrategy
 * @param {AuthProvidersWithSessionAndJWTDefaults<{
 * 	sessions: {
 * 		revokeOneById: SessionsProvider['revokeOneById'];
 * 		deleteOneById: SessionsProvider['deleteOneById'];
 * 	};
 * }>} props.authProviders
 */
export async function invalidateOneAuthSessionToken(props) {
	const { session } = await getCurrentAuthSession({
		ipAddress: props.ipAddress,
		userAgent: props.userAgent,
		cookies: props.cookies,
		headers: props.headers,
		tx: props.tx,
		authStrategy: props.authStrategy,
		authProviders: getDefaultSessionAndJWTFromAuthProviders(props.authProviders),
	});

	if (!session) {
		return false;
	}

	const { shouldDeleteCookie = true } = props;
	if (shouldDeleteCookie) {
		deleteAuthTokenCookies({
			authStrategy: props.authStrategy,
			cookies: props.cookies,
		});
	}

	return await props.authProviders.sessions.revokeOneById(session.id);
}
