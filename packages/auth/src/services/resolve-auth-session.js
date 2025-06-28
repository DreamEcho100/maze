/** @import { MultiErrorSingleSuccessResponse, UserEmailVerificationRequestsProvider, PasswordResetSessionsProvider, UsersProvider, AuthProvidersWithGetSessionProviders, AuthProvidersWithGetSessionUtils, ValidSessionResult } from "#types.ts"; */

import {
	RESOLVE_AUTH_SESSION_MESSAGES_ERRORS,
	RESOLVE_AUTH_SESSION_MESSAGES_SUCCESS,
} from "#utils/constants.js";
import { generateGetCurrentAuthSessionProps } from "#utils/generate-get-current-auth-session-props.js";
import { isPromise } from "#utils/is-promise.js";
import { deleteAuthTokenCookies, getRefreshTokenFromCookies } from "#utils/sessions/cookies.js";
import {
	getAuthorizationTokenFromHeaders,
	getRefreshTokenFromHeaders,
} from "#utils/sessions/headers.js";
import { getCurrentAuthSession } from "#utils/sessions/index.js";
import { resolveAuthSession } from "#utils/sessions/resolve-auth-session.js";
import { resolveAuthSessionServiceInputSchema } from "#utils/validations.js";

/**
 *
 * @param {AuthProvidersWithGetSessionUtils & {
 * 	authProviders: AuthProvidersWithGetSessionProviders;
 * 	input?: unknown;
 * }} props
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    RESOLVE_AUTH_SESSION_MESSAGES_ERRORS,
 *    RESOLVE_AUTH_SESSION_MESSAGES_SUCCESS,
 * 		ValidSessionResult
 *  >
 * >}
 */
export async function resolveAuthSessionService(props) {
	const input = resolveAuthSessionServiceInputSchema.safeParse(props.input);

	if (!input.success) {
		return RESOLVE_AUTH_SESSION_MESSAGES_ERRORS.INVALID_OR_MISSING_FIELDS;
	}
	const { session } = await getCurrentAuthSession(await generateGetCurrentAuthSessionProps(props));

	if (!session) return RESOLVE_AUTH_SESSION_MESSAGES_ERRORS.AUTHENTICATION_REQUIRED;

	const [userAgent, ipAddress] = await Promise.all([
		props.userAgent
			? typeof props.userAgent === "function"
				? isPromise(props.userAgent)
					? await props.userAgent()
					: props.userAgent()
				: props.userAgent
			: null,
		props.ipAddress
			? typeof props.ipAddress === "function"
				? isPromise(props.ipAddress)
					? await props.ipAddress()
					: props.ipAddress()
				: props.ipAddress
			: null,
	]);

	let refreshToken;
	switch (props.authStrategy) {
		case "jwt": {
			refreshToken =
				getRefreshTokenFromCookies(props.cookies) ?? getRefreshTokenFromHeaders(props.headers);

			break;
		}

		case "session": {
			refreshToken =
				getAuthorizationTokenFromHeaders(props.headers) ??
				getRefreshTokenFromCookies(props.cookies);
			break;
		}

		default: {
			// throw new Error(`Unsupported auth strategy: ${props.authStrategy}`);
			return RESOLVE_AUTH_SESSION_MESSAGES_ERRORS.UNSUPPORTED_AUTH_STRATEGY;
		}
	}

	if (!refreshToken || typeof refreshToken !== "string" || refreshToken.length === 0) {
		return RESOLVE_AUTH_SESSION_MESSAGES_ERRORS.AUTHENTICATION_REQUIRED;
	}

	const result = await resolveAuthSession({
		authStrategy: props.authStrategy,
		refreshToken,
		canMutateCookies: props.canMutateCookies,
		shouldExtendRefreshAuthTokensOnNeed: input.data?.shouldExtendRefreshAuthTokensOnNeed,
		ipAddress,
		userAgent,
		tx: props.tx,
		authProviders: {
			sessions: {
				findOneWithUser: props.authProviders.sessions.findOneWithUser,
				deleteOneById: props.authProviders.sessions.deleteOneById,
				extendOneExpirationDate: props.authProviders.sessions.extendOneExpirationDate,
				revokeOneById: props.authProviders.sessions.revokeOneById,
				createOne: props.authProviders.sessions.createOne,
			},
			jwt: {
				verifyRefreshToken: props.authProviders.jwt?.verifyRefreshToken,
			},
		},
		cookies: props.cookies,
	});

	if (!result.session) {
		deleteAuthTokenCookies({
			authStrategy: props.authStrategy,
			cookies: props.cookies,
			cookiesOptions: props.cookiesOptions,
		});
		return RESOLVE_AUTH_SESSION_MESSAGES_ERRORS.AUTHENTICATION_REQUIRED;
	}

	return {
		...RESOLVE_AUTH_SESSION_MESSAGES_SUCCESS.RESOLVED_AUTH_SESSION_SUCCESSFULLY,
		data: result,
	};
}
