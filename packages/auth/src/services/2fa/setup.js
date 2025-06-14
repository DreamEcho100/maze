/** @import { UserAgent, MultiErrorSingleSuccessResponse, CookiesProvider, HeadersProvider, SessionsProvider, AuthStrategy, UsersProvider, JWTProvider, AuthProvidersWithSessionAndJWTDefaults } from "#types.ts"; */

import { SETUP_2FA_MESSAGES_ERRORS, SETUP_2FA_MESSAGES_SUCCESS } from "#utils/constants.js";
import { getDefaultSessionAndJWTFromAuthProviders } from "#utils/get-defaults-session-and-jwt-from-auth-providers.js";
import { getSessionId } from "#utils/get-session-id.js";
import { decodeBase64, verifyTOTP } from "#utils/index.js";
import { getCurrentAuthSession } from "#utils/strategy/index.js";
import { updateUserTOTPKey } from "#utils/users.js";
import { setup2FAServiceInputSchema } from "#utils/validations.js";

/**
 * Handles the setup of 2FA, including validating inputs, decoding the key, and updating session and user records.
 *
 * @param {object} props
 * @param {unknown} props.input
 * @param {CookiesProvider} props.cookies - The cookies provider to access the session token.
 * @param {HeadersProvider} props.headers - The headers provider to access the session token.
 * @param {any} props.tx - Transaction object for database operations
 * @param {string|null|undefined} props.ipAddress - Optional IP address for the session
 * @param {UserAgent|null|undefined} props.userAgent - Optional user agent for the session
 * @param {AuthStrategy} props.authStrategy
 * @param {AuthProvidersWithSessionAndJWTDefaults<{
 * 	sessions: {
 * 		markOne2FAVerified: SessionsProvider['markOne2FAVerified'];
 * 	};
 * 	users: {
 * 		updateOneTOTPKey: UsersProvider['updateOneTOTPKey'];
 * 	}
 * }>} props.authProviders
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    SETUP_2FA_MESSAGES_ERRORS,
 *    SETUP_2FA_MESSAGES_SUCCESS,
 *  >
 * >}
 */
export async function setup2FAService(props) {
	const input = setup2FAServiceInputSchema.safeParse(props.input);
	if (!input.success) {
		return SETUP_2FA_MESSAGES_ERRORS.INVALID_OR_MISSING_FIELDS;
	}

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
		return SETUP_2FA_MESSAGES_ERRORS.AUTHENTICATION_REQUIRED;
	}

	if (!user.twoFactorEnabledAt) {
		return SETUP_2FA_MESSAGES_ERRORS.TWO_FACTOR_NOT_ENABLED;
	}

	if (!user.emailVerifiedAt || (user.twoFactorRegisteredAt && !session.twoFactorVerifiedAt)) {
		return SETUP_2FA_MESSAGES_ERRORS.ACCESS_DENIED;
	}

	let key;
	try {
		key = decodeBase64(input.data.encodedKey);
	} catch {
		return SETUP_2FA_MESSAGES_ERRORS.TOTP_KEY_INVALID;
	}

	if (key.byteLength !== 20) {
		return SETUP_2FA_MESSAGES_ERRORS.TOTP_KEY_INVALID;
	}

	if (!verifyTOTP(key, 30, 6, input.data.code)) {
		return SETUP_2FA_MESSAGES_ERRORS.VERIFICATION_CODE_INVALID;
	}

	await Promise.all([
		updateUserTOTPKey(
			{ data: { key }, where: { userId: user.id } },
			{
				tx: props.tx,
				authProviders: { users: { updateOneTOTPKey: props.authProviders.users.updateOneTOTPKey } },
			},
		),
		props.authProviders.sessions.markOne2FAVerified(
			{ where: { id: getSessionId(session.token) } },
			{ tx: props.tx },
		),
	]);

	return SETUP_2FA_MESSAGES_SUCCESS.TWO_FACTOR_RESET_SUCCESSFUL;
}
