/** @import { GetCookie } from '#types.ts'; */

import { sessionRepository } from "#providers/sessions.js";
import { decodeBase64, verifyTOTP } from "#utils/index.js";
import { getCurrentSession } from "#utils/sessions.js";
import { updateUserTOTPKey } from "#utils/users.js";
import { z } from "zod";

export const SETUP_2FA_MESSAGES_ERRORS = /** @type {const} */ ({
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
    messageCode: "FORBIDDEN",
    statusCode: 403,
  },
  FORBIDDEN: {
    type: "error",
    message: "Forbidden",
    messageCode: "FORBIDDEN",
    statusCode: 403,
  },
  INVALID_KEY: {
    type: "error",
    message: "Invalid key",
    messageCode: "INVALID_KEY",
    statusCode: 400,
  },
  INVALID_CODE: {
    type: "error",
    message: "Invalid code",
    messageCode: "INVALID_CODE",
    statusCode: 400,
  },
});

export const SETUP_2FA_MESSAGES_SUCCESS = /** @type {const} */ ({
  TWO_FA_SETUP_SUCCESS: {
    type: "success",
    message: "2FA setup successful",
    messageCode: "TWO_FA_SETUP_SUCCESS",
    statusCode: 200,
  },
});

/**
 * @typedef {typeof SETUP_2FA_MESSAGES_ERRORS[keyof typeof SETUP_2FA_MESSAGES_ERRORS]} ActionResultError
 * @typedef {typeof SETUP_2FA_MESSAGES_SUCCESS[keyof typeof SETUP_2FA_MESSAGES_SUCCESS]} ActionResultSuccess
 *
 * @typedef {ActionResultError | ActionResultSuccess} ActionResult
 */

/**
 * Handles the setup of 2FA, including validating inputs, decoding the key, and updating session and user records.
 *
 * @param {unknown} data
 * @param {{ getCookie: GetCookie }} options
 * @returns {Promise<ActionResult>}
 */
export async function setup2FAService(data, options) {
  const input = z
    .object({ code: z.string().min(6), encodedKey: z.string().min(28) })
    .safeParse(data);

  if (!input.success) {
    return SETUP_2FA_MESSAGES_ERRORS.INVALID_OR_MISSING_FIELDS;
  }

  const { session, user } = await getCurrentSession(options.getCookie);
  if (!session) {
    return SETUP_2FA_MESSAGES_ERRORS.NOT_AUTHENTICATED;
  }

  if (!user.twoFactorEnabledAt) {
    return SETUP_2FA_MESSAGES_ERRORS.FORBIDDEN_2FA_NOT_ENABLED;
  }

  if (!user.emailVerifiedAt || (user.twoFactorRegisteredAt && !session.twoFactorVerifiedAt)) {
    return SETUP_2FA_MESSAGES_ERRORS.FORBIDDEN;
  }

  let key;
  try {
    key = decodeBase64(input.data.encodedKey);
  } catch {
    return SETUP_2FA_MESSAGES_ERRORS.INVALID_KEY;
  }

  if (key.byteLength !== 20) {
    return SETUP_2FA_MESSAGES_ERRORS.INVALID_KEY;
  }

  if (!verifyTOTP(key, 30, 6, input.data.code)) {
    return SETUP_2FA_MESSAGES_ERRORS.INVALID_CODE;
  }

  await Promise.all([
    updateUserTOTPKey(session.userId, key),
    // setSessionAs2FAVerifiedRepository(session.id),
    sessionRepository.setSessionAs2FAVerified(session.id),
  ]);

  return SETUP_2FA_MESSAGES_SUCCESS.TWO_FA_SETUP_SUCCESS;
}
