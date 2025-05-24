/** @import { MultiErrorSingleSuccessResponse } from "#types.ts" */

import { passwordResetSessionProvider } from "#providers/password-reset.js";
import { userProvider } from "#providers/users.js";
import { VERIFY_PASSWORD_RESET_MESSAGES_ERRORS, VERIFY_PASSWORD_RESET_MESSAGES_SUCCESS } from "#utils/constants.js";
import { validatePasswordResetSessionRequest } from "#utils/password-reset.js";


/**
 * @typedef {typeof VERIFY_PASSWORD_RESET_MESSAGES_ERRORS[keyof typeof VERIFY_PASSWORD_RESET_MESSAGES_ERRORS]} ActionResultError
 * @typedef {typeof VERIFY_PASSWORD_RESET_MESSAGES_SUCCESS[keyof typeof VERIFY_PASSWORD_RESET_MESSAGES_SUCCESS] & { data: { nextStep: 'reset-password' | 'verify-2fa' } }} ActionResultSuccess
 *
 * @typedef {ActionResultError | ActionResultSuccess} ActionResult
 */

/**
 * Handles the password reset email verification process.
 *
 * @param {unknown} code - The verification code submitted by the user.
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    VERIFY_PASSWORD_RESET_MESSAGES_ERRORS,
 *    VERIFY_PASSWORD_RESET_MESSAGES_SUCCESS,
 *    { nextStep: 'reset-password' | 'verify-2fa' }
 *  >
 * >}
 */
export async function verifyPasswordResetEmailVerificationService(code) {
  if (typeof code !== "string" || !code) {
    return VERIFY_PASSWORD_RESET_MESSAGES_ERRORS.VERIFICATION_CODE_REQUIRED;
  }

  const { session, user } = await validatePasswordResetSessionRequest();

  if (!session) {
    return VERIFY_PASSWORD_RESET_MESSAGES_ERRORS.AUTHENTICATION_REQUIRED;
  }
  if (session.emailVerifiedAt) {
    return VERIFY_PASSWORD_RESET_MESSAGES_ERRORS.ACCESS_DENIED;
  }
  if (code !== session.code) {
    return VERIFY_PASSWORD_RESET_MESSAGES_ERRORS.VERIFICATION_CODE_INVALID;
  }

  const [emailMatches] = await Promise.all([
    // setUserAsEmailVerifiedIfEmailMatchesRepository(session.userId, session.email),
    userProvider.verifyOneEmailIfMatches(session.userId,session.email),
    // updateOnePasswordResetSessionAsEmailVerifiedRepository(session.id),
    passwordResetSessionProvider.markEmailVerified(session.id),
  ]);

  if (!emailMatches) {
    return VERIFY_PASSWORD_RESET_MESSAGES_ERRORS.VERIFICATION_EXPIRED_RESTART_REQUIRED;
  }

  return {
    ...VERIFY_PASSWORD_RESET_MESSAGES_SUCCESS.EMAIL_VERIFIED_SUCCESSFULLY,
    data: {
      nextStep: user.twoFactorEnabledAt ? "verify-2fa" : "reset-password",
    },
  };
}
