/** @import { CookiesProvider, DynamicCookiesOptions, MultiErrorSingleSuccessResponse, PasswordResetSessionsProvider, SessionsProvider, UsersProvider } from "@de100/auth-shared/types" */

import {
	VERIFY_PASSWORD_RESET_2FA_VIA_RECOVERY_CODE_MESSAGES_ERRORS,
	VERIFY_PASSWORD_RESET_2FA_VIA_RECOVERY_CODE_MESSAGES_SUCCESS,
} from "@de100/auth-shared/constants";
import { verifyPasswordReset2FAViaRecoveryCodeServiceInputSchema } from "@de100/auth-shared/validations";
import { resetUser2FAWithRecoveryCode } from "#utils/2fa.js";
import { validatePasswordResetSessionRequest } from "#utils/password-reset.js";

/**
 * Handles the 2FA verification for a password reset using a recovery code.
 *
 * @param {object} props - Options for the service.
 * @param {unknown} props.input
 * @param {any} props.tx - Transaction object for database operations.
 * @param {CookiesProvider} props.cookies - Cookies provider for session management.
 * @param {DynamicCookiesOptions} [props.cookiesOptions] - Options for the cookies.
 * @param {{
 * 	passwordResetSession: {
 * 	  findOneWithUser: PasswordResetSessionsProvider["findOneWithUser"];
 * 	  deleteOne: PasswordResetSessionsProvider["deleteOne"];
 * 		markOneTwoFactorAsVerified: PasswordResetSessionsProvider["markOneTwoFactorAsVerified"];
 * 	};
 *  users: {
 * 		getOneRecoveryCodeRaw: UsersProvider['getOneRecoveryCodeRaw'];
 * 		updateOneRecoveryCodeById: UsersProvider['updateOneRecoveryCodeById'];
 * }
 * 	sessions: {
 * 		unMarkOne2FAForUser: SessionsProvider['unMarkOne2FAForUser'];
 * 	}
 * }} props.authProviders
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    VERIFY_PASSWORD_RESET_2FA_VIA_RECOVERY_CODE_MESSAGES_ERRORS,
 *    VERIFY_PASSWORD_RESET_2FA_VIA_RECOVERY_CODE_MESSAGES_SUCCESS,
 *    { nextStep: 'reset-password' }
 *  >
 * >}
 */
export async function verifyPasswordReset2FAViaRecoveryCodeService(props) {
	const input = verifyPasswordReset2FAViaRecoveryCodeServiceInputSchema.safeParse(props.input);

	if (!input.success) {
		return VERIFY_PASSWORD_RESET_2FA_VIA_RECOVERY_CODE_MESSAGES_ERRORS.TOTP_CODE_REQUIRED;
	}

	const { session, user } = await validatePasswordResetSessionRequest({
		cookies: props.cookies,
		cookiesOptions: props.cookiesOptions,
		authProviders: {
			passwordResetSession: {
				deleteOne: props.authProviders.passwordResetSession.deleteOne,
				findOneWithUser: props.authProviders.passwordResetSession.findOneWithUser,
			},
		},
	});
	if (!session)
		return VERIFY_PASSWORD_RESET_2FA_VIA_RECOVERY_CODE_MESSAGES_ERRORS.AUTHENTICATION_REQUIRED;
	if (
		!user.twoFactorEnabledAt ||
		session.twoFactorVerifiedAt ||
		!session.emailVerifiedAt ||
		!user.twoFactorRegisteredAt
	) {
		return VERIFY_PASSWORD_RESET_2FA_VIA_RECOVERY_CODE_MESSAGES_ERRORS.ACCESS_DENIED;
	}

	const valid = await resetUser2FAWithRecoveryCode(session.userId, input.data.code, {
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
	if (!valid) return VERIFY_PASSWORD_RESET_2FA_VIA_RECOVERY_CODE_MESSAGES_ERRORS.TOTP_CODE_INVALID;

	return {
		...VERIFY_PASSWORD_RESET_2FA_VIA_RECOVERY_CODE_MESSAGES_SUCCESS.TWO_FACTOR_VERIFIED_SUCCESSFULLY,
		data: { nextStep: "reset-password" },
	};
}
