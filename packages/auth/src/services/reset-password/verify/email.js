import { passwordResetSessionProvider } from "#providers/password-reset.js";
import { userProvider } from "#providers/users.js";
import { validatePasswordResetSessionRequest } from "#utils/password-reset.js";

export const VERIFY_PASSWORD_RESET_MESSAGES_ERRORS = /** @type {const} */ ({
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
  INCORRECT_CODE: {
    type: "error",
    statusCode: 400,
    message: "Incorrect code",
    messageCode: "INCORRECT_CODE",
  },
  RESTART_PROCESS: {
    type: "error",
    statusCode: 400,
    message: "Please restart the process",
    messageCode: "RESTART_PROCESS",
  },
});

export const VERIFY_PASSWORD_RESET_MESSAGES_SUCCESS = /** @type {const} */ ({
  PASSWORD_RESET_EMAIL_VERIFIED: {
    type: "success",
    statusCode: 200,
    message: "Password reset email verified successfully",
    messageCode: "PASSWORD_RESET_EMAIL_VERIFIED",
  },
});

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
 * @returns {Promise<ActionResult>}
 */
export async function verifyPasswordResetEmailVerificationService(code) {
  if (typeof code !== "string" || !code) {
    return VERIFY_PASSWORD_RESET_MESSAGES_ERRORS.INVALID_OR_MISSING_FIELDS;
  }

  const { session, user } = await validatePasswordResetSessionRequest();

  if (!session) {
    return VERIFY_PASSWORD_RESET_MESSAGES_ERRORS.NOT_AUTHENTICATED;
  }
  if (session.emailVerifiedAt) {
    return VERIFY_PASSWORD_RESET_MESSAGES_ERRORS.FORBIDDEN;
  }
  if (code !== session.code) {
    return VERIFY_PASSWORD_RESET_MESSAGES_ERRORS.INCORRECT_CODE;
  }

  const [emailMatches] = await Promise.all([
    // setUserAsEmailVerifiedIfEmailMatchesRepository(session.userId, session.email),
    userProvider.setUserAsEmailVerifiedIfEmailMatches(session.userId,session.email),
    // updateOnePasswordResetSessionAsEmailVerifiedRepository(session.id),
    passwordResetSessionProvider.updateOneSessionAsEmailVerified(session.id),
  ]);

  if (!emailMatches) {
    return VERIFY_PASSWORD_RESET_MESSAGES_ERRORS.RESTART_PROCESS;
  }

  return {
    ...VERIFY_PASSWORD_RESET_MESSAGES_SUCCESS.PASSWORD_RESET_EMAIL_VERIFIED,
    data: {
      nextStep: user.twoFactorEnabledAt ? "verify-2fa" : "reset-password",
    },
  };
}
