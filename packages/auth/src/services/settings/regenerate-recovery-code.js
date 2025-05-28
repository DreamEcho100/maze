/** @import { MultiErrorSingleSuccessResponse } from "#types.ts" */

import {
	REGENERATE_RECOVERY_CODE_MESSAGES_ERRORS,
	REGENERATE_RECOVERY_CODE_MESSAGES_SUCCESS,
} from "#utils/constants.js";
import { getCurrentAuthSession } from "#utils/strategy/index.js";
import { resetUserRecoveryCode } from "#utils/users.js";

/**
 * Regenerates the recovery code if the user is authenticated, verified, and meets necessary conditions.
 *
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    REGENERATE_RECOVERY_CODE_MESSAGES_ERRORS,
 *    REGENERATE_RECOVERY_CODE_MESSAGES_SUCCESS,
 *    { recoveryCode: string }
 *  >
 * >}
 */
export async function regenerateRecoveryCodeService() {
	const { session, user } = await getCurrentAuthSession();
	if (!session) {
		return REGENERATE_RECOVERY_CODE_MESSAGES_ERRORS.AUTHENTICATION_REQUIRED;
	}

	if (!user.emailVerifiedAt) {
		return REGENERATE_RECOVERY_CODE_MESSAGES_ERRORS.EMAIL_VERIFICATION_REQUIRED;
	}

	if (!user.twoFactorEnabledAt || !session.twoFactorVerifiedAt) {
		return REGENERATE_RECOVERY_CODE_MESSAGES_ERRORS.TWO_FACTOR_VERIFICATION_REQUIRED;
	}

	const recoveryCode = await resetUserRecoveryCode(session.userId);
	return {
		...REGENERATE_RECOVERY_CODE_MESSAGES_SUCCESS.RECOVERY_CODE_REGENERATED,
		data: { recoveryCode },
	};
}
