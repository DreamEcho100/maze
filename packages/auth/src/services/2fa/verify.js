/** @import { UserAgent, MultiErrorSingleSuccessResponse, CookiesProvider, HeadersProvider, AuthStrategy, UsersProvider, AuthProvidersWithSessionAndJWTDefaults, SessionsProvider } from "#types.ts"; */

import { VERIFY_2FA_MESSAGES_ERRORS, VERIFY_2FA_MESSAGES_SUCCESS } from "#utils/constants.js";
import { getDefaultSessionAndJWTFromAuthProviders } from "#utils/get-defaults-session-and-jwt-from-auth-providers.js";
import { getSessionId } from "#utils/get-session-id.js";
import { verifyTOTP } from "#utils/index.js";
import { getCurrentAuthSession } from "#utils/strategy/index.js";
import { verify2FAServiceInputSchema } from "#utils/validations.js";

/**
 * Handles the 2FA verification logic, validating the code, and updating session if successful.
 *
 * @param {object} props
 * @param {any} props.tx
 * @param {unknown} props.input
 * @param {CookiesProvider} props.cookies - The cookies provider to access the session token.
 * @param {HeadersProvider} props.headers - The headers provider to access the session token.
 * @param {string|null|undefined} props.ipAddress - Optional IP address for the session
 * @param {UserAgent|null|undefined} props.userAgent - Optional user agent for the session
 * @param {AuthStrategy} props.authStrategy
 * @param {AuthProvidersWithSessionAndJWTDefaults<{
 * 	sessions: { markOne2FAVerified: SessionsProvider['markOne2FAVerified'] }
 *  users: {
 * 		getOneTOTPKey: UsersProvider['getOneTOTPKey'];
 * 	};
 * }>} props.authProviders
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
	const { session, user } = await getCurrentAuthSession({
		ipAddress: props.ipAddress,
		userAgent: props.userAgent,
		cookies: props.cookies,
		headers: props.headers,
		tx: props.tx,
		authStrategy: props.authStrategy,
		authProviders: getDefaultSessionAndJWTFromAuthProviders(props.authProviders),
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
	const totpKey = await props.authProviders.users.getOneTOTPKey(user.id);
	if (!totpKey || !verifyTOTP(totpKey, 30, 6, input.data.code)) {
		return VERIFY_2FA_MESSAGES_ERRORS.VERIFICATION_CODE_INVALID;
	}

	// Mark session as 2FA verified
	await props.authProviders.sessions.markOne2FAVerified({
		where: { id: getSessionId(session.token) },
	});

	// Return success message with optional redirect flag
	return VERIFY_2FA_MESSAGES_SUCCESS.TWO_FACTOR_VERIFIED;
}
