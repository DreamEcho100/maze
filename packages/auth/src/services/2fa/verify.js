/** @import { MultiErrorSingleSuccessResponse } from "#types.ts"; */

import { z } from "zod";

import { sessionProvider, usersProvider } from "#providers/index.js";
import { VERIFY_2FA_MESSAGES_ERRORS, VERIFY_2FA_MESSAGES_SUCCESS } from "#utils/constants.js";
import { verifyTOTP } from "#utils/index.js";
import { getCurrentAuthSession } from "#utils/startegy/index.js";

/**
 * Handles the 2FA verification logic, validating the code, and updating session if successful.
 *
 * @param {unknown} data
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    VERIFY_2FA_MESSAGES_ERRORS,
 *    VERIFY_2FA_MESSAGES_SUCCESS,
 *  >
 * >}
 */
export async function verify2FAService(data) {
	// Validate code input
	const input = z.object({ code: z.string().min(6) }).safeParse(data);
	if (!input.success) {
		return VERIFY_2FA_MESSAGES_ERRORS.INVALID_OR_MISSING_FIELDS;
	}

	// Get session and user details
	const { session, user } = await getCurrentAuthSession();
	if (!session) {
		return VERIFY_2FA_MESSAGES_ERRORS.AUTHENTICATION_REQUIRED;
	}

	if (!user.twoFactorEnabledAt) {
		return VERIFY_2FA_MESSAGES_ERRORS.TWO_FACTOR_NOT_ENABLED;
	}

	if (!user.emailVerifiedAt || !user.twoFactorRegisteredAt || session.twoFactorVerifiedAt) {
		return VERIFY_2FA_MESSAGES_ERRORS.ACCESS_DENIED;
	}

	// Get TOTP key for user and verify code
	const totpKey = await usersProvider.getOneTOTPKey(user.id);
	if (!totpKey || !verifyTOTP(totpKey, 30, 6, input.data.code)) {
		return VERIFY_2FA_MESSAGES_ERRORS.VERIFICATION_CODE_INVALID;
	}

	// Mark session as 2FA verified
	await sessionProvider.markOne2FAVerified(session.id);

	// Return success message with optional redirect flag
	return VERIFY_2FA_MESSAGES_SUCCESS.TWO_FACTOR_VERIFIED;
}
