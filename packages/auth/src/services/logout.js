/** @import { GetCookie, SetCookie } from "#types.ts"; */

import { sessionProvider } from "#providers/sessions.js";
import { deleteSessionTokenCookie, getCurrentSession } from "#utils/sessions.js";

export const LOGOUT_MESSAGES_ERRORS = /** @type {const} */ ({
  NOT_AUTHENTICATED: {
    type: "error",
    message: "Not authenticated",
    messageCode: "NOT_AUTHENTICATED",
    statusCode: 401,
  },
});

export const LOGOUT_MESSAGES_SUCCESS = /** @type {const} */ ({
  LOGOUT_SUCCESS: {
    type: "success",
    message: "Logout successful",
    messageCode: "LOGOUT_SUCCESS",
    statusCode: 200,
  },
});

/**
 * @typedef {typeof LOGOUT_MESSAGES_ERRORS[keyof typeof LOGOUT_MESSAGES_ERRORS]} ActionResultError
 * @typedef {typeof LOGOUT_MESSAGES_SUCCESS[keyof typeof LOGOUT_MESSAGES_SUCCESS]} ActionResultSuccess
 *
 * @typedef {ActionResultError | ActionResultSuccess} ActionResult
 */

/**
 * Handles logout by deleting the user session and clearing session cookies.
 *
 * @param {{ getCookie: GetCookie, setCookie: SetCookie }} options
 * @returns {Promise<ActionResult>}
 */
export async function logoutService(options) {
  const { session } = await getCurrentSession(options.getCookie);
  if (!session) {
    return LOGOUT_MESSAGES_ERRORS.NOT_AUTHENTICATED;
  }

  await sessionProvider.deleteSessionById(session.id);

  deleteSessionTokenCookie(options.setCookie);

  return LOGOUT_MESSAGES_SUCCESS.LOGOUT_SUCCESS;
}
