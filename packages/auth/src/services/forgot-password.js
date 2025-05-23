import { passwordResetSessionProvider } from "#providers/password-reset.js";
import { userProvider } from "#providers/users.js";
import { dateLikeToISOString } from "#utils/dates.js";
import {
  createPasswordResetSession,
  sendPasswordResetEmail,
  setPasswordResetSessionTokenCookie,
} from "#utils/password-reset.js";
import { generateSessionToken } from "#utils/sessions.js";
import { z } from "zod";

export const FORGET_PASSWORD_MESSAGES_ERRORS = /** @type {const} */ ({
  INVALID_CREDENTIALS_OR_MISSING_FIELDS: {
    type: "error",
    messageCode: "INVALID_CREDENTIALS_OR_MISSING_FIELDS",
    message: "Invalid or missing fields",
    statusCode: 400,
  },
  ACCOUNT_DOES_NOT_EXIST: {
    type: "error",
    messageCode: "ACCOUNT_DOES_NOT_EXIST",
    message: "Account does not exist",
    statusCode: 404,
  },
});

export const FORGET_PASSWORD_MESSAGES_SUCCESS = /** @type {const} */ ({
  PASSWORD_RESET_EMAIL_SENT: {
    type: "success",
    messageCode: "PASSWORD_RESET_EMAIL_SENT",
    message: "Password reset email sent successfully",
    statusCode: 200,
  },
});

/**
 * @typedef {typeof FORGET_PASSWORD_MESSAGES_ERRORS[keyof typeof FORGET_PASSWORD_MESSAGES_ERRORS]} ActionResultError
 * @typedef {typeof FORGET_PASSWORD_MESSAGES_SUCCESS[keyof typeof FORGET_PASSWORD_MESSAGES_SUCCESS] & { data: { sessionToken: string; expiresAt: string } }} ActionResultSuccess
 *
 * @typedef {ActionResultError | ActionResultSuccess} ActionResult
 */

/**
 * Handles the forgot password logic, verifying the user, creating a reset session, and sending the reset email.
 *
 * @param {unknown} data
 * @returns {Promise<ActionResult>}
 */
export async function forgotPasswordService(data) {
  const input = z.object({ email: z.string().email() }).safeParse(data);

  if (!input.success) {
    return FORGET_PASSWORD_MESSAGES_ERRORS.INVALID_CREDENTIALS_OR_MISSING_FIELDS;
  }

  const user = await userProvider.findOneByEmail(input.data.email);
  if (user === null) {
    return FORGET_PASSWORD_MESSAGES_ERRORS.ACCOUNT_DOES_NOT_EXIST;
  }

  const sessionToken = generateSessionToken();
  const [session] = await Promise.all([
    createPasswordResetSession(sessionToken, user.id, user.email),
    passwordResetSessionProvider.deleteAllByUserId(user.id),
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
