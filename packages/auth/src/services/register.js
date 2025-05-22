/** @import { GetCookie, SetCookie, User } from "#types.ts"; */

import { userRepository } from "#providers/users.js";
import {
  createEmailVerificationRequest,
  sendVerificationEmail,
  setEmailVerificationRequestCookie,
} from "#utils/email-verification.js";
import { verifyPasswordStrength } from "#utils/passwords.js";
import { createSession, generateSessionToken, setSessionTokenCookie } from "#utils/sessions.js";
import { createUser } from "#utils/users.js";
import { z } from "zod";

export const REGISTER_MESSAGES_ERRORS = /** @type {const} */ ({
  INVALID_OR_MISSING_FIELDS: {
    type: "error",
    statusCode: 400,
    message: "Invalid or missing fields",
    messageCode: "INVALID_OR_MISSING_FIELDS",
  },
  EMAIL_ALREADY_USED: {
    type: "error",
    statusCode: 400,
    message: "Email is already used",
    messageCode: "EMAIL_ALREADY_USED",
  },
  WEAK_PASSWORD: {
    type: "error",
    statusCode: 400,
    message: "Weak password",
    messageCode: "WEAK_PASSWORD",
  },
  NEEDS_2FA_VALIDATION: {
    type: "error",
    statusCode: 403,
    message: "2FA required",
    messageCode: "NEEDS_2FA_VALIDATION",
  },
});

export const REGISTER_MESSAGES_SUCCESS = /** @type {const} */ ({
  REGISTER_SUCCESS: {
    type: "success",
    message: "registered successfully",
    messageCode: "REGISTER_SUCCESS",
    statusCode: 200,
  },
});

/**
 * @typedef {typeof REGISTER_MESSAGES_ERRORS[keyof typeof REGISTER_MESSAGES_ERRORS]} ActionResultError
 * @typedef {typeof REGISTER_MESSAGES_SUCCESS[keyof typeof REGISTER_MESSAGES_SUCCESS] & { data: { user: User } }} ActionResultSuccess
 *
 * @typedef {ActionResultError | ActionResultSuccess} ActionResult
 */

/**
 * Handles register by deleting the user session and clearing session cookies.
 *
 * @param {unknown} data
 * @param {{ getCookie: GetCookie, setCookie: SetCookie }} options
 * @returns {Promise<ActionResult>}
 */
export async function registerService(data, options) {
  const input = z
    .object({
      email: z.string().email(),
      name: z.string().min(3).max(32),
      password: z.string().min(8),
      enable2FA: z.preprocess((value) => {
        if (typeof value === "boolean") {
          return value;
        }
        return value === "on";
      }, z.boolean().optional().default(false)),
    })
    .safeParse(data);

  if (!input.success) {
    return REGISTER_MESSAGES_ERRORS.INVALID_OR_MISSING_FIELDS;
  }

  const emailAvailable = await userRepository.getOneByEmail(input.data.email);

  if (emailAvailable) {
    return REGISTER_MESSAGES_ERRORS.EMAIL_ALREADY_USED;
  }

  const strongPassword = await verifyPasswordStrength(input.data.password);

  if (!strongPassword) {
    return REGISTER_MESSAGES_ERRORS.WEAK_PASSWORD;
  }

  const user = await createUser(input.data.email, input.data.name, input.data.password);

  const emailVerificationRequest = await createEmailVerificationRequest(user.id, user.email);

  await sendVerificationEmail(emailVerificationRequest.email, emailVerificationRequest.code);

  setEmailVerificationRequestCookie(emailVerificationRequest, options.setCookie);

  const sessionToken = generateSessionToken();
  const session = await createSession(sessionToken, user.id, {
    twoFactorVerifiedAt: null,
  });

  setSessionTokenCookie({
    token: sessionToken,
    expiresAt: session.expiresAt,
    setCookie: options.setCookie,
  });

  if (user.twoFactorEnabledAt) {
    return REGISTER_MESSAGES_ERRORS.NEEDS_2FA_VALIDATION;
  }

  // redirect("/auth/2fa/setup");
  // return redirect("/auth/login");
  return {
    ...REGISTER_MESSAGES_SUCCESS.REGISTER_SUCCESS,
    data: { user },
  };
}
