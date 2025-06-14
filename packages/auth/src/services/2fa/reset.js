/** @import { UserAgent, MultiErrorSingleSuccessResponse, CookiesProvider, HeadersProvider, SessionsProvider, AuthStrategy, UsersProvider, AuthProvidersWithSessionAndJWTDefaults } from "#types.ts"; */

import { resetUser2FAWithRecoveryCode } from "#utils/2fa.js";
import { RESET_2FA_MESSAGES_ERRORS, RESET_2FA_MESSAGES_SUCCESS } from "#utils/constants.js";
import { getDefaultSessionAndJWTFromAuthProviders } from "#utils/get-defaults-session-and-jwt-from-auth-providers.js";
import { getCurrentAuthSession } from "#utils/sessions/index.js";
import { reset2FAServiceInputSchema } from "#utils/validations.js";

/**
 * Handles resetting 2FA using a recovery code, with validation checks and permission verification.
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
 * 	sessions: { unMarkOne2FAForUser: SessionsProvider['unMarkOne2FAForUser']; };
 *  users: {
 * 		getOneRecoveryCodeRaw: UsersProvider['getOneRecoveryCodeRaw'];
 * 		updateOneRecoveryCodeById: UsersProvider['updateOneRecoveryCodeById'];
 * 	};
 * }>} props.authProviders
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    RESET_2FA_MESSAGES_ERRORS,
 *    RESET_2FA_MESSAGES_SUCCESS,
 *  >
 * >}
 */
export async function reset2FAService(props) {
	const input = reset2FAServiceInputSchema.safeParse(props.input);
	if (!input.success) {
		return RESET_2FA_MESSAGES_ERRORS.RECOVERY_CODE_REQUIRED;
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
		return RESET_2FA_MESSAGES_ERRORS.AUTHENTICATION_REQUIRED;
	}

	if (!user.twoFactorEnabledAt) {
		return RESET_2FA_MESSAGES_ERRORS.TWO_FACTOR_NOT_ENABLED;
	}

	if (!user.emailVerifiedAt || !user.twoFactorRegisteredAt || session.twoFactorVerifiedAt) {
		return RESET_2FA_MESSAGES_ERRORS.ACCESS_DENIED;
	}

	const valid = await resetUser2FAWithRecoveryCode(user.id, input.data.code, {
		tx: props.tx,
		authProviders: {
			sessions: { unMarkOne2FAForUser: props.authProviders.sessions.unMarkOne2FAForUser },
			users: {
				getOneRecoveryCodeRaw: props.authProviders.users.getOneRecoveryCodeRaw,
				updateOneRecoveryCodeByUserId: props.authProviders.users.updateOneRecoveryCodeById,
			},
		},
	});

	if (!valid) {
		return RESET_2FA_MESSAGES_ERRORS.RECOVERY_CODE_INVALID;
	}

	return RESET_2FA_MESSAGES_SUCCESS.TWO_FACTOR_RESET_SUCCESSFUL;
}
