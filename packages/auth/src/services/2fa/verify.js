/** @import { GetCookie } from '#types.ts'; */

import { sessionRepository } from "#providers/sessions.js";
import { userRepository } from "#providers/users.js";
import { verifyTOTP } from "#utils/index.js";
import { getCurrentSession } from "#utils/sessions.js";
import { z } from "zod";

export const VERIFY_2FA_MESSAGES_ERRORS = /** @type {const} */ ({
  INVALID_OR_MISSING_FIELDS: {
    type: "error",
    message: "Invalid or missing fields",
    messageCode: "INVALID_OR_MISSING_FIELDS",
    statusCode: 400,
  },
  NOT_AUTHENTICATED: {
    type: "error",
    message: "Not authenticated",
    messageCode: "NOT_AUTHENTICATED",
    statusCode: 401,
  },
  FORBIDDEN_2FA_NOT_ENABLED: {
    type: "error",
    message: "Forbidden, 2FA is not enabled",
    messageCode: "FORBIDDEN_2FA_NOT_ENABLED",
    statusCode: 403,
  },
  FORBIDDEN: {
    type: "error",
    message: "Forbidden",
    messageCode: "FORBIDDEN",
    statusCode: 403,
  },
  INVALID_CODE: {
    type: "error",
    message: "Invalid code",
    messageCode: "INVALID_CODE",
    statusCode: 400,
  },
});

export const VERIFY_2FA_MESSAGES_SUCCESS = /** @type {const} */ ({
  TWO_FA_VERIFIED_SUCCESS: {
    type: "success",
    message: "2FA verification successful",
    messageCode: "TWO_FA_VERIFIED_SUCCESS",
    statusCode: 200,
  },
});

/**
 * @typedef {typeof VERIFY_2FA_MESSAGES_ERRORS[keyof typeof VERIFY_2FA_MESSAGES_ERRORS]} ActionResultError
 * @typedef {typeof VERIFY_2FA_MESSAGES_SUCCESS[keyof typeof VERIFY_2FA_MESSAGES_SUCCESS]} ActionResultSuccess
 *
 * @typedef {ActionResultError | ActionResultSuccess} ActionResult
 */

/**
 * Handles the 2FA verification logic, validating the code, and updating session if successful.
 *
 * @param {unknown} data
 * @param {{ getCookie: GetCookie }} options
 * @returns {Promise<ActionResult>}
 */
export async function verify2FAService(data, options) {
  // Validate code input
  const input = z.object({ code: z.string().min(6) }).safeParse(data);
  if (!input.success) {
    return VERIFY_2FA_MESSAGES_ERRORS.INVALID_OR_MISSING_FIELDS;
  }

  // Get session and user details
  const { session, user } = await getCurrentSession(options.getCookie);
  if (!session) {
    return VERIFY_2FA_MESSAGES_ERRORS.NOT_AUTHENTICATED;
  }

  if (!user.twoFactorEnabledAt) {
    return VERIFY_2FA_MESSAGES_ERRORS.FORBIDDEN_2FA_NOT_ENABLED;
  }

  if (!user.emailVerifiedAt || !user.twoFactorRegisteredAt || session.twoFactorVerifiedAt) {
    return VERIFY_2FA_MESSAGES_ERRORS.FORBIDDEN;
  }

  // Get TOTP key for user and verify code
  const totpKey = await userRepository.getOneTOTPKey(user.id);
  if (!totpKey || !verifyTOTP(totpKey, 30, 6, input.data.code)) {
    return VERIFY_2FA_MESSAGES_ERRORS.INVALID_CODE;
  }

  // Mark session as 2FA verified
  await sessionRepository.setSessionAs2FAVerified(session.id);

  // Return success message with optional redirect flag
  return VERIFY_2FA_MESSAGES_SUCCESS.TWO_FA_VERIFIED_SUCCESS;
}
