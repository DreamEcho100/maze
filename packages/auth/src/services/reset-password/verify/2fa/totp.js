/** @import { MultiErrorSingleSuccessResponse } from "#types.ts" */

import { passwordResetSessionProvider } from "#providers/password-reset.js";
import { userProvider } from "#providers/users.js";
import {
	VERIFY_PASSWORD_RESET_2FA_VIA_TOTP_MESSAGES_ERRORS,
	VERIFY_PASSWORD_RESET_2FA_VIA_TOTP_MESSAGES_SUCCESS,
} from "#utils/constants.js";
import { verifyTOTP } from "#utils/index.js";
import { validatePasswordResetSessionRequest } from "#utils/password-reset.js";

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
	// TODO: Add validation using `zod`
	if (typeof code !== "string" || !code) {
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
	const totpKey = await userProvider.getOneTOTPKey(user.id);
	if (!totpKey || !verifyTOTP(totpKey, 30, 6, code)) {
		return VERIFY_PASSWORD_RESET_2FA_VIA_TOTP_MESSAGES_ERRORS.INVALID_TOTP_CODE;
	}

	// await updateOnePasswordRemarkOne2FAVerifiedRepository(session.id);
	await passwordResetSessionProvider.markOneTwoFactorAsVerified(session.id);
	return {
		...VERIFY_PASSWORD_RESET_2FA_VIA_TOTP_MESSAGES_SUCCESS.TWO_FACTOR_VERIFIED_FOR_PASSWORD_RESET,
		data: { nextStep: "reset-password" },
	};
}
