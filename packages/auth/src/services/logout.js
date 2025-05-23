import { cookiesProvider } from "#providers/cookies.js";
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
 * @returns {Promise<ActionResult>}
 */
export async function logoutService() {
  const { session } = await getCurrentSession();
  if (!session) {
    return LOGOUT_MESSAGES_ERRORS.NOT_AUTHENTICATED;
  }

  await sessionProvider.deleteSessionById(session.id);

  deleteSessionTokenCookie(cookiesProvider.set);

  return LOGOUT_MESSAGES_SUCCESS.LOGOUT_SUCCESS;
}
