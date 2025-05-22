/** @import { User } from '#types.ts'; */

import { verifyPasswordStrength } from "#utils/passwords.js";
import { updateUserPassword } from "#utils/users.js";

export const UPDATE_PASSWORD_MESSAGES_ERRORS = /** @type {const} */ ({
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

export const UPDATE_PASSWORD_MESSAGES_SUCCESS = /** @type {const} */ ({
  PASSWORD_UPDATED_SUCCESS: {
    type: "success",
    statusCode: 200,
    message: "Password updated successfully",
  },
});

/**
 * @typedef {typeof UPDATE_PASSWORD_MESSAGES_ERRORS[keyof typeof UPDATE_PASSWORD_MESSAGES_ERRORS]} ActionResultError
 * @typedef {typeof UPDATE_PASSWORD_MESSAGES_SUCCESS[keyof typeof UPDATE_PASSWORD_MESSAGES_SUCCESS] & { data: { user: User } }} ActionResultSuccess
 * @typedef {ActionResultError | ActionResultSuccess} ActionResult
 */

/**
 *
 * Handles updating a user's password, including validation and session management.
 *
 * @param {{
 *  newPassword: string,
 *  userId: string,
 * }} data
 * @returns {Promise<ActionResult>}
 */
export async function adminUpdatePasswordService(data) {
  if (typeof data.newPassword !== "string") {
    return UPDATE_PASSWORD_MESSAGES_ERRORS.INVALID_OR_MISSING_FIELDS;
  }

  const strongPassword = await verifyPasswordStrength(data.newPassword);
  if (!strongPassword) return UPDATE_PASSWORD_MESSAGES_ERRORS.WEAK_PASSWORD;

  const updatedUser = await updateUserPassword(data.userId, data.newPassword);

  return {
    ...UPDATE_PASSWORD_MESSAGES_SUCCESS.PASSWORD_UPDATED_SUCCESS,
    data: { user: updatedUser },
  };
}
