/** @import { UserAgent, MultiErrorSingleSuccessResponse, SessionMetadata, CookiesProvider, HeadersProvider, AuthStrategy, UsersProvider, PasswordResetSessionsProvider, AuthProvidersWithSessionAndJWTDefaults, JWTProvider } from "#types.ts"; */

import {
	FORGET_PASSWORD_MESSAGES_ERRORS,
	FORGET_PASSWORD_MESSAGES_SUCCESS,
} from "#utils/constants.js";
import { dateLikeToISOString } from "#utils/dates.js";
import { getDefaultSessionAndJWTFromAuthProviders } from "#utils/get-defaults-session-and-jwt-from-auth-providers.js";
import {
	createPasswordResetSession,
	sendPasswordResetEmail,
	setPasswordResetSessionTokenCookie,
} from "#utils/password-reset.js";
import { generateAuthSessionToken, getCurrentAuthSession } from "#utils/strategy/index.js";
import { forgotPasswordServiceInputSchema } from "#utils/validations.js";

/**
 * Handles the forgot password logic, verifying the user, creating a reset session, and sending the reset email.
 *
 * @param {object} props - Options for the service.
 * @param {unknown} props.input
 * @param {any} props.tx - Transaction object for database operations
 * @param {CookiesProvider} props.cookies - Cookies provider for session management.
 * @param {HeadersProvider} props.headers - The headers provider to access the session token.
 * @param {string|null|undefined} props.ipAddress - Optional IP address for the session
 * @param {UserAgent|null|undefined} props.userAgent - Optional user agent for the session
 * @param {AuthStrategy} props.authStrategy
 * @param {AuthProvidersWithSessionAndJWTDefaults<{
 * 	jwt?: {
 * 		createRefreshToken: JWTProvider['createRefreshToken'];
 * 	};
 *  users: {
 * 		findOneByEmail: UsersProvider['findOneByEmail'];
 * 	};
 *  passwordResetSession: {
 * 		createOne: PasswordResetSessionsProvider['createOne'];
 * 		deleteAllByUserId: PasswordResetSessionsProvider['deleteAllByUserId'];
 * 	};
 * }>} props.authProviders
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    FORGET_PASSWORD_MESSAGES_ERRORS,
 *    FORGET_PASSWORD_MESSAGES_SUCCESS,
 *    { sessionToken: string; expiresAt: string }
 *  >
 * >}
 */
export async function forgotPasswordService(props) {
	const input = forgotPasswordServiceInputSchema.safeParse(props.input);
	const { session } = await getCurrentAuthSession({
		ipAddress: props.ipAddress,
		userAgent: props.userAgent,
		cookies: props.cookies,
		headers: props.headers,
		tx: props.tx,
		authStrategy: props.authStrategy,
		authProviders: getDefaultSessionAndJWTFromAuthProviders(props.authProviders),
	});

	if (!session) return FORGET_PASSWORD_MESSAGES_ERRORS.AUTHENTICATION_REQUIRED;

	if (!input.success) {
		return FORGET_PASSWORD_MESSAGES_ERRORS.EMAIL_REQUIRED;
	}

	const user = await props.authProviders.users.findOneByEmail(input.data.email);
	if (!user) return FORGET_PASSWORD_MESSAGES_ERRORS.ACCOUNT_NOT_FOUND;

	/** @type {SessionMetadata} */
	const sessionInputBasicInfo = {
		ipAddress: props.ipAddress ?? null,
		userAgent: props.userAgent ?? null,
		twoFactorVerifiedAt: session.twoFactorVerifiedAt,
		userId: user.id,
		metadata: session.metadata,
	};
	const sessionToken = generateAuthSessionToken(
		{ data: { user: user, metadata: sessionInputBasicInfo } },
		{
			authStrategy: props.authStrategy,
			authProviders: { jwt: { createRefreshToken: props.authProviders.jwt?.createRefreshToken } },
		},
	);
	const [passwordResetEmailSession] = await Promise.all([
		createPasswordResetSession(
			{ data: { token: sessionToken, userId: user.id, email: user.email } },
			{
				tx: props.tx,
				authProviders: {
					passwordResetSession: { createOne: props.authProviders.passwordResetSession.createOne },
				},
			},
		),
		props.authProviders.passwordResetSession.deleteAllByUserId(
			{ where: { userId: user.id } },
			{ tx: props.tx },
		),
	]);

	await sendPasswordResetEmail(passwordResetEmailSession.email, passwordResetEmailSession.code);
	setPasswordResetSessionTokenCookie(
		sessionToken,
		passwordResetEmailSession.expiresAt,
		props.cookies,
	);

	return {
		...FORGET_PASSWORD_MESSAGES_SUCCESS.PASSWORD_RESET_EMAIL_SENT,
		data: {
			sessionToken,
			expiresAt: dateLikeToISOString(passwordResetEmailSession.expiresAt),
		},
	};
}
