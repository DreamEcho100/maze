import { sessionProvider } from "#providers/sessions.js";
import { userProvider } from "#providers/users.js";
import { verifyPasswordHash, verifyPasswordStrength } from "#utils/passwords.js";
import {
  createSession,
  generateSessionToken,
  getCurrentSession,
  setSessionTokenCookie,
} from "#utils/sessions.js";
import { updateUserPassword } from "#utils/users.js";

export const UPDATE_PASSWORD_MESSAGES_ERRORS = /** @type {const} */ ({
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
  WEAK_PASSWORD: {
    type: "error",
    statusCode: 400,
    message: "Weak password",
    messageCode: "WEAK_PASSWORD",
  },
  USER_NOT_FOUND: {
    type: "error",
    statusCode: 404,
    message: "User not found",
    messageCode: "USER_NOT_FOUND",
  },
  INCORRECT_PASSWORD: {
    type: "error",
    statusCode: 400,
    message: "Incorrect password",
    messageCode: "INCORRECT_PASSWORD",
  },
});

export const UPDATE_PASSWORD_MESSAGES_SUCCESS = /** @type {const} */ ({
  PASSWORD_UPDATED_SUCCESS: {
    type: "success",
    statusCode: 200,
    message: "Password updated successfully",
  },
});

/**
 * @typedef {typeof UPDATE_PASSWORD_MESSAGES_ERRORS[keyof typeof UPDATE_PASSWORD_MESSAGES_ERRORS]} ActionResultError
 * @typedef {typeof UPDATE_PASSWORD_MESSAGES_SUCCESS[keyof typeof UPDATE_PASSWORD_MESSAGES_SUCCESS]} ActionResultSuccess
 * @typedef {ActionResultError | ActionResultSuccess} ActionResult
 */

/**
 *
 * Handles updating a user's password, including validation and session management.
 *
 * @param {unknown} currentPassword The user's current password
 * @param {unknown} newPassword The new password to set for the user
 * @returns {Promise<ActionResult>}
 */
export async function updatePasswordService(currentPassword, newPassword) {
  const { session, user } = await getCurrentSession();

  if (!session) return UPDATE_PASSWORD_MESSAGES_ERRORS.NOT_AUTHENTICATED;

  if (user.twoFactorEnabledAt && user.twoFactorRegisteredAt && !session.twoFactorVerifiedAt) {
    return UPDATE_PASSWORD_MESSAGES_ERRORS.FORBIDDEN;
  }

  if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
    return UPDATE_PASSWORD_MESSAGES_ERRORS.INVALID_OR_MISSING_FIELDS;
  }

  const strongPassword = await verifyPasswordStrength(newPassword);
  if (!strongPassword) return UPDATE_PASSWORD_MESSAGES_ERRORS.WEAK_PASSWORD;

  const passwordHash = await userProvider.getOnePasswordHash(user.id);
  if (!passwordHash) return UPDATE_PASSWORD_MESSAGES_ERRORS.USER_NOT_FOUND;

  const validPassword = await verifyPasswordHash(passwordHash, currentPassword);
  if (!validPassword) return UPDATE_PASSWORD_MESSAGES_ERRORS.INCORRECT_PASSWORD;

  await Promise.all([
    sessionProvider.invalidateUserSessions(user.id),
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

  return UPDATE_PASSWORD_MESSAGES_SUCCESS.PASSWORD_UPDATED_SUCCESS;
}
