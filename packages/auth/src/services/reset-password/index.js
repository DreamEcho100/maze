import { passwordResetSessionProvider } from "#providers/password-reset.js";
import { sessionProvider } from "#providers/sessions.js";
import {
  deletePasswordResetSessionTokenCookie,
  validatePasswordResetSessionRequest,
} from "#utils/password-reset.js";
import { verifyPasswordStrength } from "#utils/passwords.js";
import { createSession, generateSessionToken, setSessionTokenCookie } from "#utils/sessions.js";
import { updateUserPassword } from "#utils/users.js";

export const RESET_PASSWORD_MESSAGES_ERRORS = /** @type {const} */ ({
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
  FORBIDDEN_EMAIL_NOT_VERIFIED: {
    type: "error",
    statusCode: 403,
    message: "Email not verified",
    messageCode: "FORBIDDEN_EMAIL_NOT_VERIFIED",
  },
  INVALID_OR_MISSING_FIELDS: {
    type: "error",
    statusCode: 400,
    message: "Invalid or missing fields",
    messageCode: "INVALID_OR_MISSING_FIELDS",
  },
  WEAK_PASSWORD: {
    type: "error",
    statusCode: 400,
    message: "Weak password",
    messageCode: "WEAK_PASSWORD",
  },
});

export const RESET_PASSWORD_MESSAGES_SUCCESS = /** @type {const} */ ({
  PASSWORD_RESET_SUCCESS: {
    type: "success",
    statusCode: 200,
    message: "Password reset successfully",
    messageCode: "PASSWORD_RESET_SUCCESS",
  },
});

/**
 * @typedef {typeof RESET_PASSWORD_MESSAGES_ERRORS[keyof typeof RESET_PASSWORD_MESSAGES_ERRORS]} ActionResultError
 * @typedef {typeof RESET_PASSWORD_MESSAGES_SUCCESS[keyof typeof RESET_PASSWORD_MESSAGES_SUCCESS]} ActionResultSuccess
 *
 * @typedef {ActionResultError | ActionResultSuccess} ActionResult
 */

/**
 * Handles the reset password process, including validation and session management.
 *
 * @param {string} password The new password to set for the user
 * @returns {Promise<ActionResult>}
 */
export async function resetPasswordService(password) {
  const { session: passwordResetSession, user } = await validatePasswordResetSessionRequest();

  if (!passwordResetSession) {
    return RESET_PASSWORD_MESSAGES_ERRORS.NOT_AUTHENTICATED;
  }

  if (!passwordResetSession.emailVerifiedAt) {
    return RESET_PASSWORD_MESSAGES_ERRORS.FORBIDDEN_EMAIL_NOT_VERIFIED;
  }

  if (
    user.twoFactorEnabledAt &&
    user.twoFactorRegisteredAt &&
    !passwordResetSession.twoFactorVerifiedAt
  ) {
    return RESET_PASSWORD_MESSAGES_ERRORS.FORBIDDEN;
  }

  const strongPassword = await verifyPasswordStrength(password);
  if (!strongPassword) {
    return RESET_PASSWORD_MESSAGES_ERRORS.WEAK_PASSWORD;
  }

  const [[sessionToken, session]] = await Promise.all([
    (async () => {
      const sessionToken = generateSessionToken();
      const session = await createSession(sessionToken, user.id, {
        twoFactorVerifiedAt: passwordResetSession.twoFactorVerifiedAt,
      });

      return /** @type {const} */ ([sessionToken, session]);
    })(),
    passwordResetSessionProvider.deleteAllSessionsForUser(passwordResetSession.userId),
    sessionProvider.invalidateUserSessions(passwordResetSession.userId),
    updateUserPassword(passwordResetSession.userId, password),
  ]);

  setSessionTokenCookie({
    token: sessionToken,
    expiresAt: session.expiresAt,
  });

  deletePasswordResetSessionTokenCookie();

  return RESET_PASSWORD_MESSAGES_SUCCESS.PASSWORD_RESET_SUCCESS;
}
