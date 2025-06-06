/** @import { UserAgent, MultiErrorSingleSuccessResponse } from "#types.ts"; */

import { resetUser2FAWithRecoveryCode } from "#utils/2fa.js";
import { RESET_2FA_MESSAGES_ERRORS, RESET_2FA_MESSAGES_SUCCESS } from "#utils/constants.js";
import { getCurrentAuthSession } from "#utils/strategy/index.js";
import { reset2FAServiceInputSchema } from "#utils/validations.js";

/**
 * Handles resetting 2FA using a recovery code, with validation checks and permission verification.
 *
 * @param {unknown} data
 * @param {object} options
 * @param {any} options.tx - Transaction object for database operations
 * @param {string|null|undefined} options.ipAddress - Optional IP address for the session
 * @param {UserAgent|null|undefined} options.userAgent - Optional user agent for the session
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    RESET_2FA_MESSAGES_ERRORS,
 *    RESET_2FA_MESSAGES_SUCCESS,
 *  >
 * >}
 */
export async function reset2FAService(data, options) {
	const input = reset2FAServiceInputSchema.safeParse(data);
	if (!input.success) {
		return RESET_2FA_MESSAGES_ERRORS.RECOVERY_CODE_REQUIRED;
	}

	const { session, user } = await getCurrentAuthSession({
		ipAddress: options.ipAddress,
		userAgent: options.userAgent,
	});
	if (!session) {
		return RESET_2FA_MESSAGES_ERRORS.AUTHENTICATION_REQUIRED;
	}

	if (!user.twoFactorEnabledAt) {
		return RESET_2FA_MESSAGES_ERRORS.TWO_FACTOR_NOT_ENABLED;
	}

	if (!user.emailVerifiedAt || !user.twoFactorRegisteredAt || session.twoFactorVerifiedAt) {
		return RESET_2FA_MESSAGES_ERRORS.ACCESS_DENIED;
	}

	const valid = await resetUser2FAWithRecoveryCode(user.id, input.data.code, options.tx);

	if (!valid) {
		return RESET_2FA_MESSAGES_ERRORS.RECOVERY_CODE_INVALID;
	}

	return RESET_2FA_MESSAGES_SUCCESS.TWO_FACTOR_RESET_SUCCESSFUL;
}
