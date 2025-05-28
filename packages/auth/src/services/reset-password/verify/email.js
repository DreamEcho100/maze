/** @import { MultiErrorSingleSuccessResponse } from "#types.ts" */

import { passwordResetSessionProvider, usersProvider } from "#providers/index.js";
import {
	VERIFY_PASSWORD_RESET_MESSAGES_ERRORS,
	VERIFY_PASSWORD_RESET_MESSAGES_SUCCESS,
} from "#utils/constants.js";
import { validatePasswordResetSessionRequest } from "#utils/password-reset.js";

/**
 * @typedef {typeof VERIFY_PASSWORD_RESET_MESSAGES_ERRORS[keyof typeof VERIFY_PASSWORD_RESET_MESSAGES_ERRORS]} ActionResultError
 * @typedef {typeof VERIFY_PASSWORD_RESET_MESSAGES_SUCCESS[keyof typeof VERIFY_PASSWORD_RESET_MESSAGES_SUCCESS] & { data: { nextStep: 'reset-password' | 'verify-2fa' } }} ActionResultSuccess
 *
 * @typedef {ActionResultError | ActionResultSuccess} ActionResult
 */

/**
 * Handles the password reset email verification process.
 *
 * @param {unknown} code - The verification code submitted by the user.
 * @param {{ tx: any }} options
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    VERIFY_PASSWORD_RESET_MESSAGES_ERRORS,
 *    VERIFY_PASSWORD_RESET_MESSAGES_SUCCESS,
 *    { nextStep: 'reset-password' | 'verify-2fa' }
 *  >
 * >}
 */
export async function verifyPasswordResetEmailVerificationService(code, options) {
	if (typeof code !== "string" || !code) {
		return VERIFY_PASSWORD_RESET_MESSAGES_ERRORS.VERIFICATION_CODE_REQUIRED;
	}

	const { session, user } = await validatePasswordResetSessionRequest();

	if (!session) {
		return VERIFY_PASSWORD_RESET_MESSAGES_ERRORS.AUTHENTICATION_REQUIRED;
	}
	if (session.emailVerifiedAt) {
		return VERIFY_PASSWORD_RESET_MESSAGES_ERRORS.ACCESS_DENIED;
	}
	if (code !== session.code) {
		return VERIFY_PASSWORD_RESET_MESSAGES_ERRORS.VERIFICATION_CODE_INVALID;
	}

	const [emailMatches] = await Promise.all([
		// setUserAsEmailVerifiedIfEmailMatchesRepository(session.userId, session.email),
		usersProvider
			.verifyOneEmailIfMatches(
				{ where: { id: session.userId, email: session.email } },
				{ tx: options.tx },
			)
			.then((result) => {
				if (!result) {
					throw new Error("Email does not match the user's email.");
				}
				return true;
			}),
		// updateOnePasswordResetSessionAsEmailVerifiedRepository(session.id),
		passwordResetSessionProvider.markOneEmailAsVerified(
			{ where: { id: session.id } },
			{ tx: options.tx },
		),
	]).catch((err) => {
		console.error("Error verifying email:", err);
		return [null];
	});

	if (!emailMatches) {
		return VERIFY_PASSWORD_RESET_MESSAGES_ERRORS.VERIFICATION_EXPIRED_RESTART_REQUIRED;
	}

	return {
		...VERIFY_PASSWORD_RESET_MESSAGES_SUCCESS.EMAIL_VERIFIED_SUCCESSFULLY,
		data: {
			nextStep: user.twoFactorEnabledAt ? "verify-2fa" : "reset-password",
		},
	};
}
