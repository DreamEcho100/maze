/** @import { UserAgent, MultiErrorSingleSuccessResponse, SessionMetadata, CookiesProvider, PasswordResetSessionsProvider, AuthStrategy, SessionsProvider } from "#types.ts"; */

import {
	RESET_PASSWORD_MESSAGES_ERRORS,
	RESET_PASSWORD_MESSAGES_SUCCESS,
} from "#utils/constants.js";
import {
	deletePasswordResetSessionTokenCookie,
	validatePasswordResetSessionRequest,
} from "#utils/password-reset.js";
import { verifyPasswordStrength } from "#utils/passwords.js";
import {
	createAuthSession,
	generateAuthSessionToken,
	setOneAuthSessionToken,
} from "#utils/strategy/index.js";
import { updateUserPassword } from "#utils/users.js";
import { resetPasswordServiceInputSchema } from "#utils/validations.js";

/**
 * Handles the reset password process, including validation and session management.
 *
 * @param {object} props
 * @param {unknown} props.input
 * @param {any} props.tx - Transaction object for database operations.
 * @param {CookiesProvider} props.cookies - Cookies provider for session management.
 * @param {string|null|undefined} props.ipAddress - Optional IP address for the session
 * @param {UserAgent|null|undefined} props.userAgent - Optional user agent for the session
 * @param {AuthStrategy} props.authStrategy
 * @param {{
 * 	passwordResetSession: {
 * 	  findOneWithUser: PasswordResetSessionsProvider["findOneWithUser"];
 * 	  deleteOne: PasswordResetSessionsProvider["deleteOne"];
 * 		deleteAllByUserId: PasswordResetSessionsProvider["deleteAllByUserId"];
 * 	};
 * 	sessions: {
 * 		createOne: SessionsProvider['createOne'];
 * 		deleteAllByUserId: SessionsProvider['deleteAllByUserId'];
 * 	}
 * }} props.authProviders
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    RESET_PASSWORD_MESSAGES_ERRORS,
 *    RESET_PASSWORD_MESSAGES_SUCCESS,
 *    { session: ReturnType<typeof setOneAuthSessionToken> }
 *  >
 * >}
 */
export async function resetPasswordService(props) {
	const input = resetPasswordServiceInputSchema.safeParse(props.input);
	if (!input.success) {
		return RESET_PASSWORD_MESSAGES_ERRORS.INVALID_OR_MISSING_FIELDS;
	}

	const { password } = input.data;

	const { session: passwordResetSession, user } = await validatePasswordResetSessionRequest(
		props.cookies,
		{
			authProviders: {
				passwordResetSession: {
					deleteOne: props.authProviders.passwordResetSession.deleteOne,
					findOneWithUser: props.authProviders.passwordResetSession.findOneWithUser,
				},
			},
		},
	);

	if (!passwordResetSession) {
		return RESET_PASSWORD_MESSAGES_ERRORS.AUTHENTICATION_REQUIRED;
	}

	if (!passwordResetSession.emailVerifiedAt) {
		return RESET_PASSWORD_MESSAGES_ERRORS.EMAIL_VERIFICATION_REQUIRED;
	}

	if (
		user.twoFactorEnabledAt &&
		user.twoFactorRegisteredAt &&
		!passwordResetSession.twoFactorVerifiedAt
	) {
		return RESET_PASSWORD_MESSAGES_ERRORS.ACCESS_DENIED;
	}

	const strongPassword = await verifyPasswordStrength(password);
	if (!strongPassword) {
		return RESET_PASSWORD_MESSAGES_ERRORS.PASSWORD_TOO_WEAK;
	}
	/** @type {SessionMetadata} */
	const sessionInputBasicInfo = {
		ipAddress: props.ipAddress ?? null,
		userAgent: props.userAgent ?? null,
		twoFactorVerifiedAt: passwordResetSession.twoFactorVerifiedAt,
		userId: user.id,
		metadata: null,
	};
	const [session] = await Promise.all([
		(async () => {
			const sessionToken = generateAuthSessionToken(
				{ data: { user: user, metadata: sessionInputBasicInfo } },
				{ authStrategy: props.authStrategy },
			);
			const session = await createAuthSession(
				{
					data: {
						token: sessionToken,
						metadata: sessionInputBasicInfo,
						user,
					},
				},
				{
					tx: props.tx,
					authStrategy: props.authStrategy,
					authProviders: {
						sessions: {
							createOne: props.authProviders.sessions.createOne,
						},
					},
				},
			);

			return session;
		})(),
		props.authProviders.passwordResetSession.deleteAllByUserId(
			{ where: { userId: passwordResetSession.userId } },
			{ tx: props.tx },
		),
		props.authProviders.sessions.deleteAllByUserId(
			{ where: { userId: passwordResetSession.userId } },
			{ tx: props.tx },
		),
		updateUserPassword({ data: { password }, where: { id: user.id } }, { tx: props.tx }),
	]);
	const result = setOneAuthSessionToken(session, {
		cookies: props.cookies,
		userAgent: props.userAgent,
		authStrategy: props.authStrategy,
	});
	deletePasswordResetSessionTokenCookie(props.cookies);

	return {
		...RESET_PASSWORD_MESSAGES_SUCCESS.PASSWORD_RESET_SUCCESSFUL,
		data: { session: result },
	};
}
