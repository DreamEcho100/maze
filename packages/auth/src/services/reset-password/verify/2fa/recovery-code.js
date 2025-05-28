/** @import { MultiErrorSingleSuccessResponse } from "#types.ts" */

import { z } from "zod";

import { resetUser2FAWithRecoveryCode } from "#utils/2fa.js";
import {
	VERIFY_PASSWORD_RESET_2FA_VIA_RECOVERY_CODE_MESSAGES_ERRORS,
	VERIFY_PASSWORD_RESET_2FA_VIA_RECOVERY_CODE_MESSAGES_SUCCESS,
} from "#utils/constants.js";
import { validatePasswordResetSessionRequest } from "#utils/password-reset.js";

const codeSchema = z.string().length(6).regex(/^\d+$/);
const verifyCodeInput = z.object({ code: codeSchema });

/**
 * Handles the 2FA verification for a password reset using a recovery code.
 *
 * @param {unknown} code - The recovery code.
 * @param {{ tx: any }} options
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    VERIFY_PASSWORD_RESET_2FA_VIA_RECOVERY_CODE_MESSAGES_ERRORS,
 *    VERIFY_PASSWORD_RESET_2FA_VIA_RECOVERY_CODE_MESSAGES_SUCCESS,
 *    { nextStep: 'reset-password' }
 *  >
 * >}
 */
export async function verifyPasswordReset2FAViaRecoveryCodeService(code, options) {
	const input = verifyCodeInput.safeParse({ code });

	if (!input.success) {
		return VERIFY_PASSWORD_RESET_2FA_VIA_RECOVERY_CODE_MESSAGES_ERRORS.TOTP_CODE_REQUIRED;
	}

	const { session, user } = await validatePasswordResetSessionRequest();
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
