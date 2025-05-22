/** @import { GetCookie, SetCookie } from "#types.ts"; */

import { getCurrentSession } from "#utils/sessions.js";
import { updateUserTwoFactorEnabledService } from "#utils/users.js";
import { z } from "zod";

export const UPDATE_IS_TWO_FACTOR_MESSAGES_ERRORS = /** @type {const} */ ({
  NOT_AUTHENTICATED: {
    type: "error",
    statusCode: 401,
    message: "Not authenticated",
  },
  INVALID_FIELDS: {
    type: "error",
    statusCode: 400,
    message: "Invalid or missing fields",
  },
});

export const UPDATE_IS_TWO_FACTOR_MESSAGES_SUCCESS = /** @type {const} */ ({
  SUCCESS: {
    type: "success",
    statusCode: 200,
    message: "Updated two-factor authentication",
  },
});

/**
 * @typedef {typeof UPDATE_IS_TWO_FACTOR_MESSAGES_ERRORS[keyof typeof UPDATE_IS_TWO_FACTOR_MESSAGES_ERRORS]} ActionResultError
 * @typedef {typeof UPDATE_IS_TWO_FACTOR_MESSAGES_SUCCESS[keyof typeof UPDATE_IS_TWO_FACTOR_MESSAGES_SUCCESS]} ActionResultSuccess
 * @typedef {ActionResultError | ActionResultSuccess} ActionResult
 */

/**
 * Toggles two-factor authentication based on the input.
 *
 * @param {unknown} isTwoFactorEnabled - Whether two-factor should be enabled.
 * @param {{ getCookie: GetCookie, setCookie: SetCookie }} options
 * @returns {Promise<ActionResult>}
 */
export async function updateIsTwoFactorService(isTwoFactorEnabled, options) {
  const input = z
    .preprocess((value) => {
      if (typeof value === "boolean") {
        return value;
      }

      return value === "on";
    }, z.boolean().optional().default(false))
    .safeParse(isTwoFactorEnabled);

  if (!input.success) return UPDATE_IS_TWO_FACTOR_MESSAGES_ERRORS.INVALID_FIELDS;

  const { session, user } = await getCurrentSession(options.getCookie);
  if (!session) return UPDATE_IS_TWO_FACTOR_MESSAGES_ERRORS.NOT_AUTHENTICATED;

  await updateUserTwoFactorEnabledService(user.id, isTwoFactorEnabled ? new Date() : null);

  return UPDATE_IS_TWO_FACTOR_MESSAGES_SUCCESS.SUCCESS;
}
