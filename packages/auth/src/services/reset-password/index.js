/** @import { MultiErrorSingleSuccessResponse } from "#types.ts"; */

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

/**
 * Handles the reset password process, including validation and session management.
 *
 * @param {string} password The new password to set for the user
 * @param {{ tx: any }} options Options for the service, including transaction management
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    RESET_PASSWORD_MESSAGES_ERRORS,
 *    RESET_PASSWORD_MESSAGES_SUCCESS,
 *    { session: ReturnType<typeof setOneAuthSessionToken> }
 *  >
 * >}
 */
export async function resetPasswordService(password, options) {
	const { session: passwordResetSession, user } = await validatePasswordResetSessionRequest();

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

	const [session] = await Promise.all([
		(async () => {
			const sessionToken = generateAuthSessionToken({ data: { userId: user.id } });
			const session = await createAuthSession(
				{
					data: {
						token: sessionToken,
						userId: user.id,
						flags: {
							twoFactorVerifiedAt: passwordResetSession.twoFactorVerifiedAt,
						},
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

	const result = setOneAuthSessionToken(session);

	deletePasswordResetSessionTokenCookie();

	return {
		...RESET_PASSWORD_MESSAGES_SUCCESS.PASSWORD_RESET_SUCCESSFUL,
		data: { session: result },
	};
}
