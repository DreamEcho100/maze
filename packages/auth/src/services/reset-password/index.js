/** @import { UserAgent, MultiErrorSingleSuccessResponse, SessionMetadata, CookiesProvider, PasswordResetSessionsProvider, AuthStrategy, SessionsProvider, UsersProvider, JWTProvider, AuthProvidersWithSessionAndJWTDefaults, HeadersProvider } from "#types.ts"; */

import {
	RESET_PASSWORD_MESSAGES_ERRORS,
	RESET_PASSWORD_MESSAGES_SUCCESS,
} from "#utils/constants.js";
import { getDefaultSessionAndJWTFromAuthProviders } from "#utils/get-defaults-session-and-jwt-from-auth-providers.js";
import {
	deletePasswordResetSessionTokenCookie,
	validatePasswordResetSessionRequest,
} from "#utils/password-reset.js";
import { verifyPasswordStrength } from "#utils/passwords.js";
import { createAuthSession, getCurrentAuthSession } from "#utils/sessions/index.js";
import { updateUserPassword } from "#utils/users.js";
import { resetPasswordServiceInputSchema } from "#utils/validations.js";

/**
 * Handles the reset password process, including validation and session management.
 *
 * @param {object} props
 * @param {unknown} props.input
 * @param {any} props.tx - Transaction object for database operations.
 * @param {CookiesProvider} props.cookies - Cookies provider for session management.
 * @param {HeadersProvider} props.headers - Cookies provider for session management.
 * @param {string|null|undefined} props.ipAddress - Optional IP address for the session
 * @param {UserAgent|null|undefined} props.userAgent - Optional user agent for the session
 * @param {() => string} props.generateRandomId
 * @param {AuthStrategy} props.authStrategy
 * @param {AuthProvidersWithSessionAndJWTDefaults<{
 * 	sessions: {
 * 		createOne: SessionsProvider['createOne'];
 * 		deleteAllByUserId: SessionsProvider['deleteAllByUserId'];
 * 	};
 *	jwt?: {
 * 		createTokenPair?: JWTProvider['createTokenPair']
 * 		createRefreshToken: JWTProvider['createRefreshToken'];
 * 	};
 * 	users: {
 * 		updateOnePassword: UsersProvider['updateOnePassword'];
 * 	};
 * 	passwordResetSession: {
 * 	  findOneWithUser: PasswordResetSessionsProvider["findOneWithUser"];
 * 	  deleteOne: PasswordResetSessionsProvider["deleteOne"];
 * 		deleteAllByUserId: PasswordResetSessionsProvider["deleteAllByUserId"];
 * 	};
 * }>} props.authProviders
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    RESET_PASSWORD_MESSAGES_ERRORS,
 *    RESET_PASSWORD_MESSAGES_SUCCESS,
 *    { session: Awaited<ReturnType<typeof newSession>> }
 *  >
 * >}
 */
export async function resetPasswordService(props) {
	const { session, user } = await getCurrentAuthSession({
		ipAddress: props.ipAddress,
		userAgent: props.userAgent,
		cookies: props.cookies,
		headers: props.headers,
		tx: props.tx,
		authStrategy: props.authStrategy,
		authProviders: getDefaultSessionAndJWTFromAuthProviders(props.authProviders),
	});

	if (!session) return RESET_PASSWORD_MESSAGES_ERRORS.AUTHENTICATION_REQUIRED;

	const input = resetPasswordServiceInputSchema.safeParse(props.input);
	if (!input.success) {
		return RESET_PASSWORD_MESSAGES_ERRORS.INVALID_OR_MISSING_FIELDS;
	}

	const { password } = input.data;

	const { session: passwordResetSession } = await validatePasswordResetSessionRequest(
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
	await Promise.all([
		props.authProviders.passwordResetSession.deleteAllByUserId(
			{ where: { userId: passwordResetSession.userId } },
			{ tx: props.tx },
		),
		props.authProviders.sessions.deleteAllByUserId(
			{ where: { userId: passwordResetSession.userId } },
			{ tx: props.tx },
		),
		updateUserPassword(
			{ data: { password }, where: { id: user.id } },
			{
				tx: props.tx,
				authProviders: {
					users: { updateOnePassword: props.authProviders.users.updateOnePassword },
				},
			},
		),
	]);
	deletePasswordResetSessionTokenCookie(props.cookies);

	const newSession = await createAuthSession({
		cookies: props.cookies,
		userAgent: props.userAgent,
		generateRandomId: props.generateRandomId,
		metadata: sessionInputBasicInfo,
		user,
		tx: props.tx,
		authStrategy: props.authStrategy,
		authProviders: {
			sessions: {
				createOne: props.authProviders.sessions.createOne,
			},
			jwt: { createTokenPair: props.authProviders.jwt?.createTokenPair },
		},
	});

	return {
		...RESET_PASSWORD_MESSAGES_SUCCESS.PASSWORD_RESET_SUCCESSFUL,
		data: { session: newSession },
	};
}
