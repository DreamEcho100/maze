/** @import { MultiErrorSingleSuccessResponse } from "#types.ts" */

import { sessionProvider } from "#providers/sessions.js";
import { userProvider } from "#providers/users.js";
import { UPDATE_PASSWORD_MESSAGES_ERRORS, UPDATE_PASSWORD_MESSAGES_SUCCESS } from "#utils/constants.js";
import { verifyPasswordHash, verifyPasswordStrength } from "#utils/passwords.js";
import {
  createSession,
  generateSessionToken,
  getCurrentSession,
  setSessionTokenCookie,
} from "#utils/sessions.js";
import { updateUserPassword } from "#utils/users.js";

/**
 *
 * Handles updating a user's password, including validation and session management.
 *
 * @param {unknown} currentPassword The user's current password
 * @param {unknown} newPassword The new password to set for the user
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    UPDATE_PASSWORD_MESSAGES_ERRORS,
 *    UPDATE_PASSWORD_MESSAGES_SUCCESS,
 *  >
 * >}
 */
export async function updatePasswordService(currentPassword, newPassword) {
  const { session, user } = await getCurrentSession();

  if (!session) return UPDATE_PASSWORD_MESSAGES_ERRORS.AUTHENTICATION_REQUIRED;

  if (user.twoFactorEnabledAt && user.twoFactorRegisteredAt && !session.twoFactorVerifiedAt) {
    return UPDATE_PASSWORD_MESSAGES_ERRORS.TWO_FACTOR_SETUP_OR_VERIFICATION_REQUIRED;
  }

  if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
    return UPDATE_PASSWORD_MESSAGES_ERRORS.PASSWORDS_REQUIRED;
  }

  const strongPassword = await verifyPasswordStrength(newPassword);
  if (!strongPassword) return UPDATE_PASSWORD_MESSAGES_ERRORS.PASSWORD_TOO_WEAK;

  const passwordHash = await userProvider.getOnePasswordHash(user.id);
  if (!passwordHash) return UPDATE_PASSWORD_MESSAGES_ERRORS.ACCOUNT_NOT_FOUND;

  const validPassword = await verifyPasswordHash(passwordHash, currentPassword);
  if (!validPassword) return UPDATE_PASSWORD_MESSAGES_ERRORS.CURRENT_PASSWORD_INCORRECT;

  await Promise.all([
    sessionProvider.invalidateAllByUserId(user.id),
    updateUserPassword(user.id, newPassword),
  ]);

  const sessionToken = generateSessionToken();
  const newSession = await createSession(sessionToken, user.id, {
    twoFactorVerifiedAt: session.twoFactorVerifiedAt,
  });

  setSessionTokenCookie({
    token: sessionToken,
    expiresAt: newSession.expiresAt,
  });

  return UPDATE_PASSWORD_MESSAGES_SUCCESS.PASSWORD_UPDATED_SUCCESSFULLY;
}
