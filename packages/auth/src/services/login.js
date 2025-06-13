/** @import { UserAgent, MultiErrorSingleSuccessResponse, SessionMetadata, CookiesProvider, HeadersProvider, UsersProvider, AuthStrategy, SessionsProvider } from "#types.ts" */

import { LOGIN_MESSAGES_ERRORS, LOGIN_MESSAGES_SUCCESS } from "#utils/constants.js";
import { verifyPasswordHash } from "#utils/passwords.js";
import {
	createAuthSession,
	generateAuthSessionToken,
	setOneAuthSessionToken,
} from "#utils/strategy/index.js";
import { loginServiceInputSchema } from "#utils/validations.js";

/**
 * Verifies the user's credentials and creates a session if valid.
 *
 * @param {object} props
 * @param {unknown} props.input
 * @param {CookiesProvider} props.cookies - The cookies provider to access the session token.
 * @param {string|null|undefined} props.ipAddress - Optional IP address for the session.
 * @param {UserAgent|null|undefined} props.userAgent - Optional user agent for the session.
 * @param {AuthStrategy} props.authStrategy
 * @param {{
 * 	sessions: {
 * 		createOne: SessionsProvider['createOne']
 * 	};
 * 	users: {
 * 		findOneByEmail: UsersProvider['findOneByEmail'];
 * 		getOnePasswordHash: UsersProvider['getOnePasswordHash'];
 * 	};
 * }} props.authProviders
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    LOGIN_MESSAGES_ERRORS,
 *    LOGIN_MESSAGES_SUCCESS,
 *    { session: ReturnType<typeof setOneAuthSessionToken> }
 *  >
 * >}
 */
export async function loginUserService(props) {
	const input = loginServiceInputSchema.safeParse(props.input);
	if (!input.success) {
		return LOGIN_MESSAGES_ERRORS.INVALID_CREDENTIALS;
	}

	const user = await props.authProviders.users.findOneByEmail(input.data.email);
	if (!user) {
		return LOGIN_MESSAGES_ERRORS.ACCOUNT_NOT_FOUND;
	}

	if (!user.emailVerifiedAt) {
		// return redirect("/auth/verify-email");
		return LOGIN_MESSAGES_ERRORS.EMAIL_VERIFICATION_REQUIRED;
	}

	const passwordHash = await props.authProviders.users.getOnePasswordHash(user.id);
	if (!passwordHash) {
		return LOGIN_MESSAGES_ERRORS.USER_DOES_NOT_EXIST_OR_PASSWORD_NOT_SET;
	}

	const validPassword = await verifyPasswordHash(passwordHash, input.data.password);
	if (!validPassword) {
		return LOGIN_MESSAGES_ERRORS.INVALID_CREDENTIALS;
	}

	/** @type {SessionMetadata} */
	const sessionInputBasicInfo = {
		ipAddress: props.ipAddress ?? null,
		userAgent: props.userAgent ?? null,
		twoFactorVerifiedAt: null,
		userId: user.id,
		metadata: null,
	};
	const sessionToken = generateAuthSessionToken(
		{ data: { user: user, metadata: sessionInputBasicInfo } },
		{ authStrategy: props.authStrategy },
	);
	const session = await createAuthSession(
		{
			data: {
				token: sessionToken,
				user,
				metadata: sessionInputBasicInfo,
			},
		},
		{
			authStrategy: props.authStrategy,
			authProviders: {
				sessions: { createOne: props.authProviders.sessions.createOne },
			},
		},
	);
	const result = setOneAuthSessionToken(session, {
		cookies: props.cookies,
		userAgent: props.userAgent,
		authStrategy: props.authStrategy,
	});

	if (user.twoFactorEnabledAt && !user.twoFactorRegisteredAt) {
		return LOGIN_MESSAGES_ERRORS.TWO_FACTOR_SETUP_REQUIRED;
	}

	if (user.twoFactorEnabledAt) {
		return LOGIN_MESSAGES_ERRORS.TWO_FACTOR_VERIFICATION_REQUIRED;
	}

	return {
		...LOGIN_MESSAGES_SUCCESS.LOGGED_IN_SUCCESSFULLY,
		data: { session: result },
	};
}
