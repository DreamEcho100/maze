/** @import { MultiErrorSingleSuccessResponse } from "#types.ts" */

import { sessionProvider } from "#providers/sessions.js";
import { LOGOUT_MESSAGES_ERRORS, LOGOUT_MESSAGES_SUCCESS } from "#utils/constants.js";
import { deleteSessionTokenCookie, getCurrentSession } from "#utils/sessions.js";

/**
 * Handles logout by deleting the user session and clearing session cookies.
 *
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    LOGOUT_MESSAGES_ERRORS,
 *    LOGOUT_MESSAGES_SUCCESS
 *  >
 * >}
 */
export async function logoutService() {
  const { session } = await getCurrentSession();
  if (!session) {
    return LOGOUT_MESSAGES_ERRORS.AUTHENTICATION_REQUIRED;
  }

  await sessionProvider.deleteById(session.id);

  deleteSessionTokenCookie();

  return LOGOUT_MESSAGES_SUCCESS.LOGOUT_SUCCESS;
}
