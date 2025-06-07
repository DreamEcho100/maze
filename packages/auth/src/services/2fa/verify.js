/** @import { UserAgent, MultiErrorSingleSuccessResponse, CookiesProvider, HeadersProvider } from "#types.ts"; */

import { authConfig } from "#init/index.js";
import { VERIFY_2FA_MESSAGES_ERRORS, VERIFY_2FA_MESSAGES_SUCCESS } from "#utils/constants.js";
import { getSessionId } from "#utils/get-session-id.js";
import { verifyTOTP } from "#utils/index.js";
import { getCurrentAuthSession } from "#utils/strategy/index.js";
import { verify2FAServiceInputSchema } from "#utils/validations.js";

/**
 * Handles the 2FA verification logic, validating the code, and updating session if successful.
 *
 * @param {unknown} data
 * @param {object} options
 * @param {CookiesProvider} options.cookies - The cookies provider to access the session token.
 * @param {HeadersProvider} options.headers - The headers provider to access the session token.
 * @param {string|null|undefined} options.ipAddress - Optional IP address for the session
 * @param {UserAgent|null|undefined} options.userAgent - Optional user agent for the session
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    VERIFY_2FA_MESSAGES_ERRORS,
 *    VERIFY_2FA_MESSAGES_SUCCESS,
 *  >
 * >}
 */
export async function verify2FAService(data, options) {
	// Validate code input
	const input = verify2FAServiceInputSchema.safeParse(data);
	if (!input.success) {
		return VERIFY_2FA_MESSAGES_ERRORS.INVALID_OR_MISSING_FIELDS;
	}

	// Get session and user details
	const { session, user } = await getCurrentAuthSession({
		ipAddress: options.ipAddress,
		userAgent: options.userAgent,
		cookies: options.cookies,
		headers: options.headers,
	});
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
	const totpKey = await authConfig.providers.users.getOneTOTPKey(user.id);
	if (!totpKey || !verifyTOTP(totpKey, 30, 6, input.data.code)) {
		return VERIFY_2FA_MESSAGES_ERRORS.VERIFICATION_CODE_INVALID;
	}

	// Mark session as 2FA verified
	await authConfig.providers.session.markOne2FAVerified({
		where: { id: getSessionId(session.token) },
	});

	// Return success message with optional redirect flag
	return VERIFY_2FA_MESSAGES_SUCCESS.TWO_FACTOR_VERIFIED;
}
