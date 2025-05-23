import { userProvider } from "#providers/users.js";
import { LOGIN_MESSAGES_ERRORS, LOGIN_MESSAGES_SUCCESS } from "#utils/constants.js";
import { dateLikeToISOString } from "#utils/dates.js";
import { verifyPasswordHash } from "#utils/passwords.js";
import { createSession, generateSessionToken, setSessionTokenCookie } from "#utils/sessions.js";
import { z } from "zod";

/**
 * @typedef {{ type: 'error'; statusCode: number; message: string; messageCode: typeof LOGIN_MESSAGES_ERRORS[keyof typeof LOGIN_MESSAGES_ERRORS]["code"] }} ActionResultError
 * @typedef {{ type: 'success'; statusCode: number; message: string; messageCode: typeof LOGIN_MESSAGES_SUCCESS[keyof typeof LOGIN_MESSAGES_SUCCESS]["code"]; data: { sessionToken: string; expiresAt: string } }} ActionResultSuccess
 *
 * @typedef {ActionResultError | ActionResultSuccess} ActionResult
 */

/**
 * Verifies the user’s credentials and creates a session if valid.
 *
 * @param {unknown} data
 * @param {{ setCookie: (key: string, value: string, options: object) => void }} options
 * @returns {Promise<ActionResult>}
 */
export async function loginUserService(data, options) {
  const input = z
    .object({
      email: z.string().email(),
      password: z.string().min(6),
    })
    .safeParse(data);

  if (!input.success) {
    return {
      type: "error",
      statusCode: LOGIN_MESSAGES_ERRORS.INVALID_CREDENTIALS_OR_MISSING_FIELDS.statusCode,
      message: "Invalid credentials or missing fields",
      messageCode: LOGIN_MESSAGES_ERRORS.INVALID_CREDENTIALS_OR_MISSING_FIELDS.code,
    };
  }

  const user = await userProvider.findOneByEmail(input.data.email);
  if (user === null) {
    return {
      type: "error",
      statusCode: LOGIN_MESSAGES_ERRORS.ACCOUNT_DOES_NOT_EXIST.statusCode,
      message: "Account does not exist",
      messageCode: LOGIN_MESSAGES_ERRORS.ACCOUNT_DOES_NOT_EXIST.code,
    };
  }

  if (!user.emailVerifiedAt) {
    // return redirect("/auth/verify-email");
    return {
      type: "error",
      statusCode: LOGIN_MESSAGES_ERRORS.EMAIL_NOT_VERIFIED.statusCode,
      message: "Email not verified",
      messageCode: LOGIN_MESSAGES_ERRORS.EMAIL_NOT_VERIFIED.code,
    };
  }

  const passwordHash = await userProvider.getOnePasswordHash(user.id);
  if (!passwordHash) {
    return {
      type: "error",
      statusCode: LOGIN_MESSAGES_ERRORS.USER_DOES_NOT_EXIST_OR_PASSWORD_NOT_SET.statusCode,
      message: "User does not exist or password not set",
      messageCode: LOGIN_MESSAGES_ERRORS.USER_DOES_NOT_EXIST_OR_PASSWORD_NOT_SET.code,
    };
  }

  const validPassword = await verifyPasswordHash(passwordHash, input.data.password);
  if (!validPassword) {
    return {
      type: "error",
      statusCode: LOGIN_MESSAGES_ERRORS.INVALID_CREDENTIALS_OR_MISSING_FIELDS.statusCode,
      message: "Invalid credentials or missing fields",
      messageCode: LOGIN_MESSAGES_ERRORS.INVALID_CREDENTIALS_OR_MISSING_FIELDS.code,
    };
  }

  const sessionToken = generateSessionToken();
  const session = await createSession(sessionToken, user.id, {
    twoFactorVerifiedAt: null,
  });
  setSessionTokenCookie({
    expiresAt: session.expiresAt,
    token: sessionToken,
  });

  if (user.twoFactorEnabledAt && !user.twoFactorRegisteredAt) {
    return {
      type: "error",
      statusCode: LOGIN_MESSAGES_ERRORS.TWO_FA_NOT_SETUP.statusCode,
      message: "2FA not setup",
      messageCode: LOGIN_MESSAGES_ERRORS.TWO_FA_NOT_SETUP.code,
    };
  }

  if (user.twoFactorEnabledAt) {
    return {
      type: "error",
      statusCode: LOGIN_MESSAGES_ERRORS.TWO_FA_NOT_NEEDS_VERIFICATION.statusCode,
      message: "2FA not verified",
      messageCode: LOGIN_MESSAGES_ERRORS.TWO_FA_NOT_NEEDS_VERIFICATION.code,
    };
  }

  return {
    type: "success",
    statusCode: LOGIN_MESSAGES_SUCCESS.LOGGED_IN_SUCCESSFULLY.statusCode,
    message: "Logged in successfully",
    messageCode: LOGIN_MESSAGES_SUCCESS.LOGGED_IN_SUCCESSFULLY.code,
    data: {
      sessionToken,
      expiresAt: dateLikeToISOString(session.expiresAt),
    },
  };
}
