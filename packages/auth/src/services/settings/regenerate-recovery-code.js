/** @import { MultiErrorSingleSuccessResponse, UsersProvider, AuthProvidersWithGetSessionProviders, AuthProvidersWithGetSessionUtils } from "#types.ts" */

import {
	REGENERATE_RECOVERY_CODE_MESSAGES_ERRORS,
	REGENERATE_RECOVERY_CODE_MESSAGES_SUCCESS,
} from "#utils/constants.js";
import { generateGetCurrentAuthSessionProps } from "#utils/generate-get-current-auth-session-props.js";
import { getCurrentAuthSession } from "#utils/sessions/index.js";
import { resetUserRecoveryCode } from "#utils/users.js";

/**
 * Regenerates the recovery code if the user is authenticated, verified, and meets necessary conditions.
 *
 * @param {AuthProvidersWithGetSessionUtils & {
 * 	authProviders: AuthProvidersWithGetSessionProviders<{
 *  	users: {
 * 			updateOneRecoveryCode: UsersProvider['updateOneRecoveryCode']
 * 		};
 * 	}>
 * }} props
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    REGENERATE_RECOVERY_CODE_MESSAGES_ERRORS,
 *    REGENERATE_RECOVERY_CODE_MESSAGES_SUCCESS,
 *    { recoveryCode: string }
 *  >
 * >}
 */
export async function regenerateRecoveryCodeService(props) {
	const { session, user } = await getCurrentAuthSession(
		await generateGetCurrentAuthSessionProps(props),
	);
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
