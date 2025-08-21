/** @import { CookiesProvider, DynamicCookiesOptions, MultiErrorSingleSuccessResponse, PasswordResetSessionsProvider, UsersProvider } from "@de100/auth-shared/types" */

import {
	VERIFY_PASSWORD_RESET_2FA_VIA_TOTP_MESSAGES_ERRORS,
	VERIFY_PASSWORD_RESET_2FA_VIA_TOTP_MESSAGES_SUCCESS,
} from "@de100/auth-shared/constants";
import { verifyPasswordReset2FAViaTOTPServiceInputSchema } from "@de100/auth-shared/validations";
import { verifyTOTP } from "#utils/index.js";
import { validatePasswordResetSessionRequest } from "#utils/password-reset.js";

/**
 * Handles the 2FA verification for a password reset using TOTP.
 *
 * @param {object} props - Options for the service.
 * @param {unknown} props.input
 * @param {CookiesProvider} props.cookies - Cookies provider for session management.
 * @param {DynamicCookiesOptions} [props.cookiesOptions] - Options for the cookies.
 * @param {{
 * 	passwordResetSession: {
 * 	  findOneWithUser: PasswordResetSessionsProvider["findOneWithUser"];
 * 	  deleteOne: PasswordResetSessionsProvider["deleteOne"];
 * 		markOneTwoFactorAsVerified: PasswordResetSessionsProvider["markOneTwoFactorAsVerified"];
 * 	};
 * 	users: {
 * 		getOneTOTPKey: UsersProvider["getOneTOTPKey"];
 * 	}
 * }} props.authProviders
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    VERIFY_PASSWORD_RESET_2FA_VIA_TOTP_MESSAGES_ERRORS,
 *    VERIFY_PASSWORD_RESET_2FA_VIA_TOTP_MESSAGES_SUCCESS,
 *    { nextStep: 'reset-password' }
 *  >
 * >}
 */
export async function verifyPasswordReset2FAViaTOTPService(props) {
	const input = verifyPasswordReset2FAViaTOTPServiceInputSchema.safeParse(props.input);

	if (!input.success) {
		return VERIFY_PASSWORD_RESET_2FA_VIA_TOTP_MESSAGES_ERRORS.TOTP_CODE_REQUIRED;
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
	if (!session) return VERIFY_PASSWORD_RESET_2FA_VIA_TOTP_MESSAGES_ERRORS.AUTHENTICATION_REQUIRED;
	if (
		!user.twoFactorEnabledAt ||
		session.twoFactorVerifiedAt ||
		!session.emailVerifiedAt ||
		!user.twoFactorRegisteredAt
	) {
		return VERIFY_PASSWORD_RESET_2FA_VIA_TOTP_MESSAGES_ERRORS.ACCESS_DENIED;
	}

	// const totpKey = await getUserTOTPKeyRepository(session.userId);
	const totpKey = await props.authProviders.users.getOneTOTPKey(user.id);
	if (!totpKey || !verifyTOTP(totpKey, 30, 6, input.data.code)) {
		return VERIFY_PASSWORD_RESET_2FA_VIA_TOTP_MESSAGES_ERRORS.INVALID_TOTP_CODE;
	}

	// await updateOnePasswordRemarkOne2FAVerifiedRepository(session.id);
	await props.authProviders.passwordResetSession.markOneTwoFactorAsVerified(session.id);
	return {
		...VERIFY_PASSWORD_RESET_2FA_VIA_TOTP_MESSAGES_SUCCESS.TWO_FACTOR_VERIFIED_FOR_PASSWORD_RESET,
		data: { nextStep: "reset-password" },
	};
}
