/** @import { UserAgent, MultiErrorSingleSuccessResponse, SessionMetadata, CookiesProvider, HeadersProvider, AuthStrategy, UsersProvider, PasswordResetSessionsProvider, AuthProvidersWithGetSessionProviders, JWTProvider, AuthProvidersWithGetSessionUtils } from "#types.ts"; */

import {
	FORGET_PASSWORD_MESSAGES_ERRORS,
	FORGET_PASSWORD_MESSAGES_SUCCESS,
} from "#utils/constants.js";
import { dateLikeToISOString } from "#utils/dates.js";
import { generateGetCurrentAuthSessionProps } from "#utils/generate-get-current-auth-session-props.js";
import { generateRandomToken } from "#utils/generate-random-token.js";
import {
	createPasswordResetSession,
	sendPasswordResetEmail,
	setPasswordResetSessionTokenCookie,
} from "#utils/password-reset.js";
import { getCurrentAuthSession } from "#utils/sessions/index.js";
import { forgotPasswordServiceInputSchema } from "#utils/validations.js";

/**
 * Handles the forgot password logic, verifying the user, creating a reset session, and sending the reset email.
 *
 * @param {AuthProvidersWithGetSessionUtils & {
 * 	authProviders: AuthProvidersWithGetSessionProviders<{
 * 	 users: {
 * 			findOneByEmail: UsersProvider['findOneByEmail'];
 * 		};
 * 	 passwordResetSession: {
 * 			createOne: PasswordResetSessionsProvider['createOne'];
 * 			deleteAllByUserId: PasswordResetSessionsProvider['deleteAllByUserId'];
 * 		};
 * 	}>;
 * 	input: unknown;
 * }} props
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
	const { session } = await getCurrentAuthSession(await generateGetCurrentAuthSessionProps(props));

	if (!session) return FORGET_PASSWORD_MESSAGES_ERRORS.AUTHENTICATION_REQUIRED;

	if (!input.success) {
		return FORGET_PASSWORD_MESSAGES_ERRORS.EMAIL_REQUIRED;
	}

	const user = await props.authProviders.users.findOneByEmail(input.data.email);
	if (!user) return FORGET_PASSWORD_MESSAGES_ERRORS.ACCOUNT_NOT_FOUND;

	const sessionToken = generateRandomToken();
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
