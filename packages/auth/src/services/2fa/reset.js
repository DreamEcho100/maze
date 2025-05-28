/** @import { MultiErrorSingleSuccessResponse } from "#types.ts"; */

import { z } from "zod";

import { resetUser2FAWithRecoveryCode } from "#utils/2fa.js";
import { RESET_2FA_MESSAGES_ERRORS, RESET_2FA_MESSAGES_SUCCESS } from "#utils/constants.js";
import { getCurrentAuthSession } from "#utils/startegy/index.js";

/**
 * Handles resetting 2FA using a recovery code, with validation checks and permission verification.
 *
 * @param {unknown} data
 * @param {any} tx
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    RESET_2FA_MESSAGES_ERRORS,
 *    RESET_2FA_MESSAGES_SUCCESS,
 *  >
 * >}
 */
export async function reset2FAService(data, tx) {
	const input = z.object({ code: z.string().min(6) }).safeParse(data);

	if (!input.success) {
		return RESET_2FA_MESSAGES_ERRORS.RECOVERY_CODE_REQUIRED;
	}

	const { session, user } = await getCurrentAuthSession();
	if (!session) {
		return RESET_2FA_MESSAGES_ERRORS.AUTHENTICATION_REQUIRED;
	}

	if (!user.twoFactorEnabledAt) {
		return RESET_2FA_MESSAGES_ERRORS.TWO_FACTOR_NOT_ENABLED;
	}

	if (!user.emailVerifiedAt || !user.twoFactorRegisteredAt || session.twoFactorVerifiedAt) {
		return RESET_2FA_MESSAGES_ERRORS.ACCESS_DENIED;
	}

	const valid = await resetUser2FAWithRecoveryCode(user.id, input.data.code, tx);

	if (!valid) {
		return RESET_2FA_MESSAGES_ERRORS.RECOVERY_CODE_INVALID;
	}

	return RESET_2FA_MESSAGES_SUCCESS.TWO_FACTOR_RESET_SUCCESSFUL;
}
