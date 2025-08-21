/** @import { MultiErrorSingleSuccessResponse, SessionsProvider, UsersProvider, AuthProvidersWithGetSessionProviders, AuthProvidersWithGetSessionUtils } from "@de100/auth-shared/types"; */

import {
	RESET_2FA_MESSAGES_ERRORS,
	RESET_2FA_MESSAGES_SUCCESS,
} from "@de100/auth-shared/constants";
import { reset2FAServiceInputSchema } from "@de100/auth-shared/validations";
import { resetUser2FAWithRecoveryCode } from "#utils/2fa.js";

/**
 * Handles resetting 2FA using a recovery code, with validation checks and permission verification.
 *
 * @param {AuthProvidersWithGetSessionUtils & {
 * 	authProviders: AuthProvidersWithGetSessionProviders<{
 * 		sessions: { unMarkOne2FAForUser: SessionsProvider['unMarkOne2FAForUser']; };
 * 	 users: {
 * 			getOneRecoveryCodeRaw: UsersProvider['getOneRecoveryCodeRaw'];
 * 			updateOneRecoveryCodeById: UsersProvider['updateOneRecoveryCodeById'];
 * 		};
 * 	}>;
 * 	input: unknown;
 * }} props
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

	const { session, user } = props;
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
			sessions: {
				unMarkOne2FAForUser: props.authProviders.sessions.unMarkOne2FAForUser,
			},
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
