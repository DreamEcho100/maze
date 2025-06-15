/** @import { AuthProvidersWithGetSessionProviders, AuthProvidersWithGetSessionUtils, AuthStrategy, CookiesProvider, HeadersProvider, SessionsProvider, UserAgent } from "#types.ts" */

import { generateGetCurrentAuthSessionProps } from "#utils/generate-get-current-auth-session-props.js";
import { deleteAuthTokenCookies } from "./cookies";
import { getCurrentAuthSession } from "./get-current-auth-session";

/**
 * Strategy-aware token clearing (replaces deleteSessionTokenCookie)
 *
 * @param {AuthProvidersWithGetSessionUtils & {
 * 	authProviders: AuthProvidersWithGetSessionProviders;
 * 	shouldDeleteCookie?: boolean;
 * }} props
 */
export async function invalidateOneAuthSessionToken(props) {
	const { session } = await getCurrentAuthSession(await generateGetCurrentAuthSessionProps(props));

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
