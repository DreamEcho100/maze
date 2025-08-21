/** @import { AuthProvidersWithGetSessionProviders, AuthProvidersWithGetSessionUtils, AuthStrategy, CookiesProvider, DynamicCookiesOptions, HeadersProvider, SessionsProvider, UserAgent, ValidSessionResult } from "@de100/auth-shared/types" */

import { deleteAuthTokenCookies } from "./cookies.js";

/**
 * Strategy-aware token clearing (replaces deleteSessionTokenCookie)
 *
 * @param {{
 * 	authProviders: {
 * 		sessions: { revokeOneById: SessionsProvider['revokeOneById'] };
 * 	};
 * 	shouldDeleteCookie?: boolean;
 *  authStrategy: AuthStrategy;
 * 	cookies: CookiesProvider;
 * 	cookiesOptions?: DynamicCookiesOptions;
 * 	session: ValidSessionResult["session"];
 * }} props
 */
export async function invalidateOneAuthSessionToken(props) {
	const { shouldDeleteCookie = true } = props;
	if (shouldDeleteCookie) {
		deleteAuthTokenCookies({
			authStrategy: props.authStrategy,
			cookies: props.cookies,
			cookiesOptions: props.cookiesOptions,
		});
	}

	return await props.authProviders.sessions.revokeOneById(props.session.id);
}
