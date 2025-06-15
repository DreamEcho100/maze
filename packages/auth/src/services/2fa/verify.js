/** @import { MultiErrorSingleSuccessResponse, UsersProvider, AuthProvidersWithGetSessionProviders, SessionsProvider, AuthProvidersWithGetSessionUtils } from "#types.ts"; */

import { VERIFY_2FA_MESSAGES_ERRORS, VERIFY_2FA_MESSAGES_SUCCESS } from "#utils/constants.js";
import { generateGetCurrentAuthSessionProps } from "#utils/generate-get-current-auth-session-props.js";
import { verifyTOTP } from "#utils/index.js";
import { getCurrentAuthSession } from "#utils/sessions/index.js";
import { verify2FAServiceInputSchema } from "#utils/validations.js";

/**
 * Handles the 2FA verification logic, validating the code, and updating session if successful.
 *
 * @param {AuthProvidersWithGetSessionUtils & {
 * 	authProviders: AuthProvidersWithGetSessionProviders<{
 * 		sessions: { markOne2FAVerified: SessionsProvider['markOne2FAVerified'] }
 *  	users: {
 * 			getOneTOTPKey: UsersProvider['getOneTOTPKey'];
 * 		};
 * 	}>;
 * 	input: unknown;
 * }} props
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    VERIFY_2FA_MESSAGES_ERRORS,
 *    VERIFY_2FA_MESSAGES_SUCCESS,
 *  >
 * >}
 */
export async function verify2FAService(props) {
	// Validate code input
	const input = verify2FAServiceInputSchema.safeParse(props.input);
	if (!input.success) {
		return VERIFY_2FA_MESSAGES_ERRORS.INVALID_OR_MISSING_FIELDS;
	}

	// Get session and user details
	const { session, user } = await getCurrentAuthSession(
		await generateGetCurrentAuthSessionProps(props),
	);
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
	const totpKey = await props.authProviders.users.getOneTOTPKey(user.id);
	if (!totpKey || !verifyTOTP(totpKey, 30, 6, input.data.code)) {
		return VERIFY_2FA_MESSAGES_ERRORS.VERIFICATION_CODE_INVALID;
	}

	// Mark session as 2FA verified
	await props.authProviders.sessions.markOne2FAVerified({
		where: { id: session.id },
	});

	// Return success message with optional redirect flag
	return VERIFY_2FA_MESSAGES_SUCCESS.TWO_FACTOR_VERIFIED;
}
