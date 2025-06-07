/** @import { UserAgent, MultiErrorSingleSuccessResponse, SessionMetadata, CookiesProvider } from "#types.ts"; */

import { authConfig } from "#init/index.js";
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
 * @param {unknown} data
 * @param {object} options - Options for the service.
 * @param {any} options.tx - Transaction object for database operations.
 * @param {CookiesProvider} options.cookies - Cookies provider for session management.
 * @param {string|null|undefined} options.ipAddress - Optional IP address for the session
 * @param {UserAgent|null|undefined} options.userAgent - Optional user agent for the session
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    RESET_PASSWORD_MESSAGES_ERRORS,
 *    RESET_PASSWORD_MESSAGES_SUCCESS,
 *    { session: ReturnType<typeof setOneAuthSessionToken> }
 *  >
 * >}
 */
export async function resetPasswordService(data, options) {
	const input = resetPasswordServiceInputSchema.safeParse(data);
	if (!input.success) {
		return RESET_PASSWORD_MESSAGES_ERRORS.INVALID_OR_MISSING_FIELDS;
	}

	const { password } = input.data;

	const { session: passwordResetSession, user } = await validatePasswordResetSessionRequest(
		options.cookies,
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
		ipAddress: options.ipAddress ?? null,
		userAgent: options.userAgent ?? null,
		twoFactorVerifiedAt: passwordResetSession.twoFactorVerifiedAt,
		userId: user.id,
		metadata: null,
	};
	const [session] = await Promise.all([
		(async () => {
			const sessionToken = generateAuthSessionToken({
				data: { user: user, metadata: sessionInputBasicInfo },
			});
			const session = await createAuthSession(
				{
					data: {
						token: sessionToken,
						metadata: sessionInputBasicInfo,
						user,
					},
				},
				{ tx: options.tx },
			);

			return session;
		})(),
		authConfig.providers.passwordResetSession.deleteAllByUserId(
			{ where: { userId: passwordResetSession.userId } },
			{ tx: options.tx },
		),
		authConfig.providers.session.deleteAllByUserId(
			{ where: { userId: passwordResetSession.userId } },
			{ tx: options.tx },
		),
		updateUserPassword({ data: { password }, where: { id: user.id } }, { tx: options.tx }),
	]);
	const result = setOneAuthSessionToken(session, {
		cookies: options.cookies,
		userAgent: options.userAgent,
	});
	deletePasswordResetSessionTokenCookie(options.cookies);

	return {
		...RESET_PASSWORD_MESSAGES_SUCCESS.PASSWORD_RESET_SUCCESSFUL,
		data: { session: result },
	};
}
