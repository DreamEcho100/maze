/** @import { MultiErrorSingleSuccessResponse } from "#types.ts" */

import { resetUser2FAWithRecoveryCode } from "#utils/2fa.js";
import { VERIFY_PASSWORD_RESET_2FA_VIA_RECOVERY_CODE_MESSAGES_ERRORS, VERIFY_PASSWORD_RESET_2FA_VIA_RECOVERY_CODE_MESSAGES_SUCCESS } from "#utils/constants.js";
import { validatePasswordResetSessionRequest } from "#utils/password-reset.js";

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
  if (typeof code !== "string" || !code) {
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

  const valid = await resetUser2FAWithRecoveryCode(session.userId, code, options.tx);
  if (!valid) return VERIFY_PASSWORD_RESET_2FA_VIA_RECOVERY_CODE_MESSAGES_ERRORS.TOTP_CODE_INVALID;

  return {
    ...VERIFY_PASSWORD_RESET_2FA_VIA_RECOVERY_CODE_MESSAGES_SUCCESS.TWO_FACTOR_VERIFIED_SUCCESSFULLY,
    data: { nextStep: "reset-password" },
  };
}
