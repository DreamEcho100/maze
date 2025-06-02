/** @import { MultiErrorSingleSuccessResponse } from "#types.ts" */

import { authConfig } from "#init/index.js";
import {
	VERIFY_PASSWORD_RESET_2FA_VIA_TOTP_MESSAGES_ERRORS,
	VERIFY_PASSWORD_RESET_2FA_VIA_TOTP_MESSAGES_SUCCESS,
} from "#utils/constants.js";
import { verifyTOTP } from "#utils/index.js";
import { validatePasswordResetSessionRequest } from "#utils/password-reset.js";
import { codeSchema } from "#utils/validations.js";

/**
 * Handles the 2FA verification for a password reset using TOTP.
 *
 * @param {unknown} code - The TOTP code.
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    VERIFY_PASSWORD_RESET_2FA_VIA_TOTP_MESSAGES_ERRORS,
 *    VERIFY_PASSWORD_RESET_2FA_VIA_TOTP_MESSAGES_SUCCESS,
 *    { nextStep: 'reset-password' }
 *  >
 * >}
 */
export async function verifyPasswordReset2FAViaTOTPService(code) {
	const input = codeSchema.safeParse(code);

	if (!input.success) {
		return VERIFY_PASSWORD_RESET_2FA_VIA_TOTP_MESSAGES_ERRORS.TOTP_CODE_REQUIRED;
	}

	const { session, user } = await validatePasswordResetSessionRequest();
	if (!session) return VERIFY_PASSWORD_RESET_2FA_VIA_TOTP_MESSAGES_ERRORS.AUTHENTICATION_REQUIRED;
	if (
		!user.twoFactorEnabledAt ||
		session.twoFactorVerifiedAt ||
		!session.emailVerifiedAt ||
		!user.twoFactorRegisteredAt
	) {
		return VERIFY_PASSWORD_RESET_2FA_VIA_TOTP_MESSAGES_ERRORS.ACCESS_DENIED;
	}

	// const totpKey = await getUserTOTPKeyRepository(session.userId);
	const totpKey = await authConfig.providers.users.getOneTOTPKey(user.id);
	if (!totpKey || !verifyTOTP(totpKey, 30, 6, input.data)) {
		return VERIFY_PASSWORD_RESET_2FA_VIA_TOTP_MESSAGES_ERRORS.INVALID_TOTP_CODE;
	}

	// await updateOnePasswordRemarkOne2FAVerifiedRepository(session.id);
	await authConfig.providers.passwordResetSession.markOneTwoFactorAsVerified(session.id);
	return {
		...VERIFY_PASSWORD_RESET_2FA_VIA_TOTP_MESSAGES_SUCCESS.TWO_FACTOR_VERIFIED_FOR_PASSWORD_RESET,
		data: { nextStep: "reset-password" },
	};
}
