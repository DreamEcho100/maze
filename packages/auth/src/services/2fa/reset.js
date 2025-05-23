import { cookiesProvider } from "#providers/cookies.js";
import { resetUser2FAWithRecoveryCode } from "#utils/2fa.js";
import { getCurrentSession } from "#utils/sessions.js";
import { z } from "zod";

export const RESET_2FA_MESSAGES_ERRORS = /** @type {const} */ ({
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
  INVALID_RECOVERY_CODE: {
    type: "error",
    message: "Invalid recovery code",
    messageCode: "INVALID_RECOVERY_CODE",
    statusCode: 400,
  },
});

export const RESET_2FA_MESSAGES_SUCCESS = /** @type {const} */ ({
  TWO_FA_RESET_SUCCESS: {
    type: "success",
    message: "2FA reset successful",
    messageCode: "TWO_FA_RESET_SUCCESS",
    statusCode: 200,
  },
});

/**
 * @typedef {typeof RESET_2FA_MESSAGES_ERRORS[keyof typeof RESET_2FA_MESSAGES_ERRORS]} ActionResultError
 * @typedef {typeof RESET_2FA_MESSAGES_SUCCESS[keyof typeof RESET_2FA_MESSAGES_SUCCESS]} ActionResultSuccess
 *
 * @typedef {ActionResultError | ActionResultSuccess} ActionResult
 */

/**
 * Handles resetting 2FA using a recovery code, with validation checks and permission verification.
 *
 * @param {unknown} data
 * @param {any} tx
 * @returns {Promise<ActionResult>}
 */
export async function reset2FAService(data, tx) {
  const input = z.object({ code: z.string().min(6) }).safeParse(data);

  if (!input.success) {
    return RESET_2FA_MESSAGES_ERRORS.INVALID_OR_MISSING_FIELDS;
  }

  const { session, user } = await getCurrentSession();
  if (!session) {
    return RESET_2FA_MESSAGES_ERRORS.NOT_AUTHENTICATED;
  }

  if (!user.twoFactorEnabledAt) {
    return RESET_2FA_MESSAGES_ERRORS.FORBIDDEN_2FA_NOT_ENABLED;
  }

  if (!user.emailVerifiedAt || !user.twoFactorRegisteredAt || session.twoFactorVerifiedAt) {
    return RESET_2FA_MESSAGES_ERRORS.FORBIDDEN;
  }

  const valid = await resetUser2FAWithRecoveryCode(user.id, input.data.code, tx);

  if (!valid) {
    return RESET_2FA_MESSAGES_ERRORS.INVALID_RECOVERY_CODE;
  }

  return RESET_2FA_MESSAGES_SUCCESS.TWO_FA_RESET_SUCCESS;
}
