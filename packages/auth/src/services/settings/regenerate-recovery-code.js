/** @import { UserAgent, MultiErrorSingleSuccessResponse, HeadersProvider, CookiesProvider, AuthStrategy, UsersProvider, AuthProvidersWithSessionAndJWTDefaults } from "#types.ts" */

import {
	REGENERATE_RECOVERY_CODE_MESSAGES_ERRORS,
	REGENERATE_RECOVERY_CODE_MESSAGES_SUCCESS,
} from "#utils/constants.js";
import { getDefaultSessionAndJWTFromAuthProviders } from "#utils/get-defaults-session-and-jwt-from-auth-providers.js";
import { getCurrentAuthSession } from "#utils/sessions/index.js";
import { resetUserRecoveryCode } from "#utils/users.js";

/**
 * Regenerates the recovery code if the user is authenticated, verified, and meets necessary conditions.
 *
 * @param {object} props
 * @param {any} props.tx
 * @param {CookiesProvider} props.cookies - The cookies provider to access the session token.
 * @param {HeadersProvider} props.headers - The headers provider to access the session token.
 * @param {string|null|undefined} props.ipAddress - Optional IP address for the session
 * @param {UserAgent|null|undefined} props.userAgent - Optional user agent for the session
 * @param {AuthStrategy} props.authStrategy
 * @param {AuthProvidersWithSessionAndJWTDefaults<{
 *  users: {
 * 		updateOneRecoveryCode: UsersProvider['updateOneRecoveryCode']
 * 	};
 * }>} props.authProviders
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    REGENERATE_RECOVERY_CODE_MESSAGES_ERRORS,
 *    REGENERATE_RECOVERY_CODE_MESSAGES_SUCCESS,
 *    { recoveryCode: string }
 *  >
 * >}
 */
export async function regenerateRecoveryCodeService(props) {
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
		return REGENERATE_RECOVERY_CODE_MESSAGES_ERRORS.AUTHENTICATION_REQUIRED;
	}

	if (!user.emailVerifiedAt) {
		return REGENERATE_RECOVERY_CODE_MESSAGES_ERRORS.EMAIL_VERIFICATION_REQUIRED;
	}

	if (!user.twoFactorEnabledAt || !session.twoFactorVerifiedAt) {
		return REGENERATE_RECOVERY_CODE_MESSAGES_ERRORS.TWO_FACTOR_VERIFICATION_REQUIRED;
	}

	const recoveryCode = await resetUserRecoveryCode(session.userId, {
		authProviders: {
			users: {
				updateOneRecoveryCode: props.authProviders.users.updateOneRecoveryCode,
			},
		},
	});
	return {
		...REGENERATE_RECOVERY_CODE_MESSAGES_SUCCESS.RECOVERY_CODE_REGENERATED,
		data: { recoveryCode },
	};
}
