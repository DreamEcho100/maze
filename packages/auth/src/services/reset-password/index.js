/** @import { MultiErrorSingleSuccessResponse } from "#types.ts"; */

import { passwordResetSessionProvider } from "#providers/password-reset.js";
import { sessionProvider } from "#providers/sessions.js";
import { RESET_PASSWORD_MESSAGES_ERRORS, RESET_PASSWORD_MESSAGES_SUCCESS } from "#utils/constants.js";
import {
  deletePasswordResetSessionTokenCookie,
  validatePasswordResetSessionRequest,
} from "#utils/password-reset.js";
import { verifyPasswordStrength } from "#utils/passwords.js";
import { createSession, generateSessionToken, setSessionTokenCookie } from "#utils/sessions.js";
import { updateUserPassword } from "#utils/users.js";

/**
 * Handles the reset password process, including validation and session management.
 *
 * @param {string} password The new password to set for the user
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    RESET_PASSWORD_MESSAGES_ERRORS,
 *    RESET_PASSWORD_MESSAGES_SUCCESS,
 *  >
 * >}
 */
export async function resetPasswordService(password) {
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

  const [[sessionToken, session]] = await Promise.all([
    (async () => {
      const sessionToken = generateSessionToken();
      const session = await createSession(sessionToken, user.id, {
        twoFactorVerifiedAt: passwordResetSession.twoFactorVerifiedAt,
      });

      return /** @type {const} */ ([sessionToken, session]);
    })(),
    passwordResetSessionProvider.deleteAllByUserId(passwordResetSession.userId),
    sessionProvider.invalidateAllByUserId(passwordResetSession.userId),
    updateUserPassword(passwordResetSession.userId, password),
  ]);

  setSessionTokenCookie({
    token: sessionToken,
    expiresAt: session.expiresAt,
  });

  deletePasswordResetSessionTokenCookie();

  return RESET_PASSWORD_MESSAGES_SUCCESS.PASSWORD_RESET_SUCCESSFUL;
}
