/** @import { MultiErrorSingleSuccessResponse } from "#types.ts" */

import { UPDATE_IS_TWO_FACTOR_MESSAGES_ERRORS, UPDATE_IS_TWO_FACTOR_MESSAGES_SUCCESS } from "#utils/constants.js";
import { getCurrentSession } from "#utils/sessions.js";
import { updateUserTwoFactorEnabledService } from "#utils/users.js";
import { z } from "zod";


/**
 * @typedef {typeof UPDATE_IS_TWO_FACTOR_MESSAGES_ERRORS[keyof typeof UPDATE_IS_TWO_FACTOR_MESSAGES_ERRORS]} ActionResultError
 * @typedef {typeof UPDATE_IS_TWO_FACTOR_MESSAGES_SUCCESS[keyof typeof UPDATE_IS_TWO_FACTOR_MESSAGES_SUCCESS]} ActionResultSuccess
 * @typedef {ActionResultError | ActionResultSuccess} ActionResult
 */

/**
 * Toggles two-factor authentication based on the input.
 *
 * @param {unknown} isTwoFactorEnabled - Whether two-factor should be enabled.
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    UPDATE_IS_TWO_FACTOR_MESSAGES_ERRORS,
 *    UPDATE_IS_TWO_FACTOR_MESSAGES_SUCCESS,
 *  >
 * >}
 */
export async function updateIsTwoFactorService(isTwoFactorEnabled) {
  const input = z
    .preprocess((value) => {
      if (typeof value === "boolean") {
        return value;
      }

      return value === "on";
    }, z.boolean().optional().default(false))
    .safeParse(isTwoFactorEnabled);

  if (!input.success) return UPDATE_IS_TWO_FACTOR_MESSAGES_ERRORS.INVALID_2FA_INPUT;

  const { session, user } = await getCurrentSession();
  if (!session) return UPDATE_IS_TWO_FACTOR_MESSAGES_ERRORS.AUTHENTICATION_REQUIRED;

  await updateUserTwoFactorEnabledService(user.id, isTwoFactorEnabled ? new Date() : null);

  return UPDATE_IS_TWO_FACTOR_MESSAGES_SUCCESS.TWO_FACTOR_STATUS_UPDATED_SUCCESSFULLY;
}
