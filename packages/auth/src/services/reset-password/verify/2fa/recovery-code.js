/** @import { GetCookie, SetCookie } from "#types.ts"; */

import { resetUser2FAWithRecoveryCode } from "#utils/2fa.js";
import { validatePasswordResetSessionRequest } from "#utils/password-reset.js";

export const VERIFY_PASSWORD_RESET_2FA_VIA_RECOVERY_CODE_MESSAGES_ERRORS = /** @type {const} */ ({
  NOT_AUTHENTICATED: {
    type: "error",
    statusCode: 401,
    message: "Not authenticated",
    messageCode: "NOT_AUTHENTICATED",
  },
  FORBIDDEN: {
    type: "error",
    statusCode: 403,
    message: "Forbidden",
    messageCode: "FORBIDDEN",
  },
  INVALID_OR_MISSING_FIELDS: {
    type: "error",
    statusCode: 400,
    message: "Invalid or missing fields",
    messageCode: "INVALID_OR_MISSING_FIELDS",
  },
  INVALID_CODE: {
    type: "error",
    statusCode: 400,
    message: "Invalid code",
    messageCode: "INVALID_CODE",
  },
});

export const VERIFY_PASSWORD_RESET_2FA_VIA_RECOVERY_CODE_MESSAGES_SUCCESS = /** @type {const} */ ({
  PASSWORD_RESET_2FA_VERIFIED: {
    type: "success",
    statusCode: 200,
    message: "2FA verified",
    messageCode: "PASSWORD_RESET_2FA_VERIFIED",
  },
});

/**
 * @typedef {typeof VERIFY_PASSWORD_RESET_2FA_VIA_RECOVERY_CODE_MESSAGES_ERRORS[keyof typeof VERIFY_PASSWORD_RESET_2FA_VIA_RECOVERY_CODE_MESSAGES_ERRORS]} ActionResultError
 * @typedef {typeof VERIFY_PASSWORD_RESET_2FA_VIA_RECOVERY_CODE_MESSAGES_SUCCESS[keyof typeof VERIFY_PASSWORD_RESET_2FA_VIA_RECOVERY_CODE_MESSAGES_SUCCESS] & { data: { nextStep: 'reset-password' } }} ActionResultSuccess
 *
 * @typedef {ActionResultError | ActionResultSuccess} ActionResult
 */

/**
 * Handles the 2FA verification for a password reset using a recovery code.
 *
 * @param {unknown} code - The recovery code.
 * @param {{ getCookie: GetCookie, setCookie: SetCookie; tx: any }} options - Cookie management utilities.
 * @returns {Promise<ActionResult>}
 */
export async function verifyPasswordReset2FAViaRecoveryCodeService(code, options) {
  if (typeof code !== "string" || !code) {
    return VERIFY_PASSWORD_RESET_2FA_VIA_RECOVERY_CODE_MESSAGES_ERRORS.INVALID_OR_MISSING_FIELDS;
  }

  const { session, user } = await validatePasswordResetSessionRequest(
    options.getCookie,
    options.setCookie,
  );
  if (!session)
    return VERIFY_PASSWORD_RESET_2FA_VIA_RECOVERY_CODE_MESSAGES_ERRORS.NOT_AUTHENTICATED;
  if (
    !user.twoFactorEnabledAt ||
    session.twoFactorVerifiedAt ||
    !session.emailVerifiedAt ||
    !user.twoFactorRegisteredAt
  ) {
    return VERIFY_PASSWORD_RESET_2FA_VIA_RECOVERY_CODE_MESSAGES_ERRORS.FORBIDDEN;
  }

  const valid = await resetUser2FAWithRecoveryCode(session.userId, code, options.tx);
  if (!valid) return VERIFY_PASSWORD_RESET_2FA_VIA_RECOVERY_CODE_MESSAGES_ERRORS.INVALID_CODE;

  return {
    ...VERIFY_PASSWORD_RESET_2FA_VIA_RECOVERY_CODE_MESSAGES_SUCCESS.PASSWORD_RESET_2FA_VERIFIED,
    data: { nextStep: "reset-password" },
  };
}
