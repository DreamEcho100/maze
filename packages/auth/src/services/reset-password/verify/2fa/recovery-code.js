/** @import { CookiesProvider, MultiErrorSingleSuccessResponse } from "#types.ts" */

import { resetUser2FAWithRecoveryCode } from "#utils/2fa.js";
import {
	VERIFY_PASSWORD_RESET_2FA_VIA_RECOVERY_CODE_MESSAGES_ERRORS,
	VERIFY_PASSWORD_RESET_2FA_VIA_RECOVERY_CODE_MESSAGES_SUCCESS,
} from "#utils/constants.js";
import { validatePasswordResetSessionRequest } from "#utils/password-reset.js";
import { verifyPasswordReset2FAViaRecoveryCodeServiceInputSchema } from "#utils/validations.js";

/**
 * Handles the 2FA verification for a password reset using a recovery code.
 *
 * @param {unknown} data
 * @param {object} options - Options for the service.
 * @param {any} options.tx - Transaction object for database operations.
 * @param {CookiesProvider} options.cookies - Cookies provider for session management.
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    VERIFY_PASSWORD_RESET_2FA_VIA_RECOVERY_CODE_MESSAGES_ERRORS,
 *    VERIFY_PASSWORD_RESET_2FA_VIA_RECOVERY_CODE_MESSAGES_SUCCESS,
 *    { nextStep: 'reset-password' }
 *  >
 * >}
 */
export async function verifyPasswordReset2FAViaRecoveryCodeService(data, options) {
	const input = verifyPasswordReset2FAViaRecoveryCodeServiceInputSchema.safeParse(data);

	if (!input.success) {
		return VERIFY_PASSWORD_RESET_2FA_VIA_RECOVERY_CODE_MESSAGES_ERRORS.TOTP_CODE_REQUIRED;
	}

	const { session, user } = await validatePasswordResetSessionRequest(options.cookies);
	if (!session)
		return VERIFY_PASSWORD_RESET_2FA_VIA_RECOVERY_CODE_MESSAGES_ERRORS.AUTHENTICATION_REQUIRED;
	if (
		!user.twoFactorEnabledAt ||
		session.twoFactorVerifiedAt ||
		!session.emailVerifiedAt ||
		!user.twoFactorRegisteredAt
	) {
		return VERIFY_PASSWORD_RESET_2FA_VIA_RECOVERY_CODE_MESSAGES_ERRORS.ACCESS_DENIED;
	}

	const valid = await resetUser2FAWithRecoveryCode(session.userId, input.data.code, options.tx);
	if (!valid) return VERIFY_PASSWORD_RESET_2FA_VIA_RECOVERY_CODE_MESSAGES_ERRORS.TOTP_CODE_INVALID;

	return {
		...VERIFY_PASSWORD_RESET_2FA_VIA_RECOVERY_CODE_MESSAGES_SUCCESS.TWO_FACTOR_VERIFIED_SUCCESSFULLY,
		data: { nextStep: "reset-password" },
	};
}
