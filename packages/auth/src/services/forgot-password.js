/** @import { MultiErrorSingleSuccessResponse } from "#types.ts"; */

import { passwordResetSessionProvider } from "#providers/password-reset.js";
import { userProvider } from "#providers/users.js";
import { FORGET_PASSWORD_MESSAGES_ERRORS, FORGET_PASSWORD_MESSAGES_SUCCESS } from "#utils/constants.js";
import { dateLikeToISOString } from "#utils/dates.js";
import {
  createPasswordResetSession,
  sendPasswordResetEmail,
  setPasswordResetSessionTokenCookie,
} from "#utils/password-reset.js";
import { generateSessionToken } from "#utils/sessions.js";
import { z } from "zod";

/**
 * Handles the forgot password logic, verifying the user, creating a reset session, and sending the reset email.
 *
 * @param {unknown} data
 * @param {{ tx: any }} options
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    FORGET_PASSWORD_MESSAGES_ERRORS,
 *    FORGET_PASSWORD_MESSAGES_SUCCESS,
 *    { sessionToken: string; expiresAt: string }
 *  >
 * >}
 */
export async function forgotPasswordService(data, options) {
  const input = z.object({ email: z.string().email() }).safeParse(data);

  if (!input.success) {
    return FORGET_PASSWORD_MESSAGES_ERRORS.EMAIL_REQUIRED;
  }

  const user = await userProvider.findOneByEmail(input.data.email);
  if (user === null) {
    return FORGET_PASSWORD_MESSAGES_ERRORS.ACCOUNT_NOT_FOUND;
  }

  const sessionToken = generateSessionToken();
  const [session] = await Promise.all([
    createPasswordResetSession(
      { data: { token: sessionToken, userId: user.id, email: user.email } },
      { tx: options?.tx }
    ),
    passwordResetSessionProvider.deleteAllByUserId(
      { where: { userId: user.id } },
      { tx: options.tx }
    ),
  ]);

  await sendPasswordResetEmail(session.email, session.code);

  setPasswordResetSessionTokenCookie(sessionToken, session.expiresAt);

  return {
    ...FORGET_PASSWORD_MESSAGES_SUCCESS.PASSWORD_RESET_EMAIL_SENT,
    data: {
      sessionToken,
      expiresAt: dateLikeToISOString(session.expiresAt),
    },
  };
}
